"""Self-contained, standard-library implementation for Sprint 1–3 demonstration."""
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse
import sqlite3, json, csv, io, hashlib, hmac, secrets, os, mimetypes, threading, math

ROOT = Path(__file__).resolve().parent
DATA = Path(os.environ.get('MLME_DATA_DIR', ROOT.parent / 'data'))
DATA.mkdir(parents=True, exist_ok=True)
DB = DATA / 'evaluator.sqlite3'
MAX_UPLOAD = 10 * 1024 * 1024
SESSIONS = {}
LOCK = threading.Lock()

def connect():
    c=sqlite3.connect(DB); c.row_factory=sqlite3.Row; c.execute('PRAGMA foreign_keys=ON'); return c

def init_db():
    with connect() as c:
        c.executescript('''CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS datasets(id INTEGER PRIMARY KEY, project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE, filename TEXT NOT NULL, csv_text TEXT NOT NULL, rows INTEGER NOT NULL, columns_count INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);''')

def pw_hash(password, salt): return hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), 180000).hex()
def json_bytes(obj): return json.dumps(obj, ensure_ascii=False, allow_nan=False).encode()
def parse_csv(text):
    if not isinstance(text,str) or not text.strip(): raise ValueError('The CSV file is empty.')
    if len(text.encode('utf-8')) > MAX_UPLOAD: raise ValueError('CSV must be 10 MB or smaller.')
    try: rows=list(csv.reader(io.StringIO(text.lstrip('\ufeff'))))
    except csv.Error as e: raise ValueError('Could not parse CSV: '+str(e))
    if len(rows)<2: raise ValueError('CSV must contain a header and at least one data row.')
    header=[x.strip() for x in rows[0]]
    if not header or any(not x for x in header): raise ValueError('Every column must have a non-empty header.')
    if len(set(x.casefold() for x in header)) != len(header): raise ValueError('Column names must be unique (case-insensitive).')
    if len(header)>250: raise ValueError('CSV exceeds the 250-column limit.')
    if any(len(r)!=len(header) for r in rows[1:]): raise ValueError('Rows have inconsistent column counts. Check delimiters and quoted values.')
    data=[dict(zip(header,[v.strip() for v in r])) for r in rows[1:] if any(v.strip() for v in r)]
    if not data: raise ValueError('CSV has no non-empty data rows.')
    if len(data)>100000: raise ValueError('CSV exceeds the 100,000-row demo limit.')
    return header,data

def stats(header,data):
    columns=[]
    for h in header:
        vals=[r[h] for r in data]; non=[v for v in vals if v!='']; nums=[]
        for v in non:
            try:
                n=float(v)
                if math.isfinite(n): nums.append(n)
                else: break
            except (ValueError,TypeError): break
        numeric=len(non)>0 and len(nums)==len(non)
        columns.append({'name':h,'type':'numeric' if numeric else 'categorical','missing':len(vals)-len(non),'unique':len(set(non)),'min':min(nums) if numeric else None,'max':max(nums) if numeric else None,'mean':round(sum(nums)/len(nums),4) if numeric else None})
    return {'rowCount':len(data),'columnCount':len(header),'missingCells':sum(x['missing'] for x in columns),'duplicateRows':len(data)-len({tuple(r[h] for h in header) for r in data}),'columns':columns}

class Handler(BaseHTTPRequestHandler):
    server_version='MLME-Demo/1.0'
    def log_message(self, fmt, *args): print('[%s] %s' % (self.log_date_time_string(), fmt%args))
    def send_json(self, status, obj, extra=None):
        body=json_bytes(obj); self.send_response(status); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Content-Length',str(len(body))); self.send_header('X-Content-Type-Options','nosniff'); self.send_header('Cache-Control','no-store')
        if extra:
            for k,v in extra.items(): self.send_header(k,v)
        self.end_headers(); self.wfile.write(body)
    def body(self):
        n=int(self.headers.get('Content-Length','0'))
        if n>MAX_UPLOAD+100000: raise ValueError('Request is too large.')
        raw=self.rfile.read(n)
        try: return json.loads(raw or b'{}')
        except json.JSONDecodeError: raise ValueError('Request body must be valid JSON.')
    def session_user(self):
        token=self.headers.get('Cookie','').split('mlme_session=',1)[1].split(';',1)[0] if 'mlme_session=' in self.headers.get('Cookie','') else ''
        uid=SESSIONS.get(token)
        if not uid:return None
        with connect() as c: return c.execute('SELECT id,name,email FROM users WHERE id=?',(uid,)).fetchone()
    def require_user(self):
        u=self.session_user()
        if not u: self.send_json(401,{'error':'Please log in to continue.'}); return None
        return u
    def do_GET(self):
        path=urlparse(self.path).path
        if path=='/api/health': return self.send_json(200,{'status':'ok','service':'Web-Based ML Model Evaluator','version':'1.0-demo'})
        if path=='/api/me':
            u=self.session_user(); return self.send_json(200,{'user':dict(u) if u else None})
        if path=='/api/projects':
            u=self.require_user()
            if not u:return
            with connect() as c: projects=[dict(x) for x in c.execute('SELECT p.id,p.name,p.description,p.created_at,(SELECT COUNT(*) FROM datasets d WHERE d.project_id=p.id) dataset_count FROM projects p WHERE user_id=? ORDER BY id DESC',(u['id'],))]
            return self.send_json(200,{'projects':projects})
        if path.startswith('/api/projects/') and path.endswith('/datasets'):
            u=self.require_user()
            if not u:return
            try: pid=int(path.split('/')[3])
            except: return self.send_json(400,{'error':'Invalid project ID.'})
            with connect() as c:
                p=c.execute('SELECT id FROM projects WHERE id=? AND user_id=?',(pid,u['id'])).fetchone()
                if not p:return self.send_json(404,{'error':'Project not found.'})
                ds=[dict(x) for x in c.execute('SELECT id,filename,rows,columns_count,created_at FROM datasets WHERE project_id=? ORDER BY id DESC',(pid,))]
            return self.send_json(200,{'datasets':ds})
        if path.startswith('/api/datasets/'):
            u=self.require_user()
            if not u:return
            try: did=int(path.split('/')[3])
            except: return self.send_json(400,{'error':'Invalid dataset ID.'})
            with connect() as c:
                row=c.execute('SELECT d.* FROM datasets d JOIN projects p ON p.id=d.project_id WHERE d.id=? AND p.user_id=?',(did,u['id'])).fetchone()
            if not row:return self.send_json(404,{'error':'Dataset not found.'})
            try: header,data=parse_csv(row['csv_text'])
            except ValueError as e:return self.send_json(422,{'error':str(e)})
            return self.send_json(200,{'dataset':{'id':row['id'],'filename':row['filename'],'header':header,'preview':data[:20],'statistics':stats(header,data)}})
        if path.startswith('/assets/'):
            name=path.split('/')[-1]
            if name not in ('app.js','style.css'): return self.send_json(404,{'error':'Not found'})
            f=ROOT/name
            if not f.exists():return self.send_json(404,{'error':'Not found'})
            b=f.read_bytes(); self.send_response(200); self.send_header('Content-Type',mimetypes.guess_type(str(f))[0]+'; charset=utf-8'); self.send_header('Content-Length',str(len(b))); self.send_header('X-Content-Type-Options','nosniff'); self.end_headers(); self.wfile.write(b); return
        if path=='/' or path=='/index.html':
            f=ROOT/'index.html'; b=f.read_bytes(); self.send_response(200); self.send_header('Content-Type','text/html; charset=utf-8'); self.send_header('Content-Length',str(len(b))); self.send_header('X-Content-Type-Options','nosniff'); self.end_headers(); self.wfile.write(b); return
        return self.send_json(404,{'error':'Not found'})
    def do_POST(self):
        path=urlparse(self.path).path
        try: d=self.body()
        except ValueError as e:return self.send_json(400,{'error':str(e)})
        if path=='/api/register':
            name=str(d.get('name','')).strip(); email=str(d.get('email','')).strip().lower(); password=d.get('password','')
            if len(name)<2 or len(name)>80:return self.send_json(400,{'error':'Name must contain 2–80 characters.'})
            if len(email)>254 or '@' not in email or email.startswith('@') or email.endswith('@'):return self.send_json(400,{'error':'Enter a valid email address.'})
            if not isinstance(password,str) or len(password)<8 or len(password)>128:return self.send_json(400,{'error':'Password must contain 8–128 characters.'})
            salt=secrets.token_hex(16)
            try:
                with connect() as c:c.execute('INSERT INTO users(name,email,salt,password_hash) VALUES(?,?,?,?)',(name,email,salt,pw_hash(password,salt))); uid=c.execute('SELECT id FROM users WHERE email=?',(email,)).fetchone()['id']
            except sqlite3.IntegrityError:return self.send_json(409,{'error':'An account with this email already exists.'})
            token=secrets.token_urlsafe(32); SESSIONS[token]=uid
            return self.send_json(201,{'user':{'id':uid,'name':name,'email':email}}, {'Set-Cookie':f'mlme_session={token}; HttpOnly; SameSite=Lax; Path=/'})
        if path=='/api/login':
            email=str(d.get('email','')).strip().lower(); password=d.get('password','')
            with connect() as c:u=c.execute('SELECT * FROM users WHERE email=?',(email,)).fetchone()
            if not u or not isinstance(password,str) or not hmac.compare_digest(pw_hash(password,u['salt']),u['password_hash']):return self.send_json(401,{'error':'Email or password is incorrect.'})
            token=secrets.token_urlsafe(32); SESSIONS[token]=u['id']; return self.send_json(200,{'user':{'id':u['id'],'name':u['name'],'email':u['email']}},{'Set-Cookie':f'mlme_session={token}; HttpOnly; SameSite=Lax; Path=/'})
        u=self.require_user()
        if not u:return
        if path=='/api/logout':
            token=self.headers.get('Cookie','').split('mlme_session=',1)[1].split(';',1)[0] if 'mlme_session=' in self.headers.get('Cookie','') else ''; SESSIONS.pop(token,None)
            return self.send_json(200,{'ok':True},{'Set-Cookie':'mlme_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'})
        if path=='/api/projects':
            name=str(d.get('name','')).strip(); desc=str(d.get('description','')).strip()
            if not 2<=len(name)<=100:return self.send_json(400,{'error':'Project name must contain 2–100 characters.'})
            if len(desc)>500:return self.send_json(400,{'error':'Description must be 500 characters or fewer.'})
            with connect() as c: cur=c.execute('INSERT INTO projects(user_id,name,description) VALUES(?,?,?)',(u['id'],name,desc)); pid=cur.lastrowid
            return self.send_json(201,{'project':{'id':pid,'name':name,'description':desc,'dataset_count':0}})
        if path=='/api/datasets':
            try: pid=int(d.get('projectId')); filename=os.path.basename(str(d.get('filename','dataset.csv'))); csv_text=d.get('csvText',''); header,rows=parse_csv(csv_text)
            except (ValueError,TypeError) as e:return self.send_json(422,{'error':str(e)})
            if not filename.lower().endswith('.csv'):return self.send_json(400,{'error':'Only .csv files are supported.'})
            with connect() as c:
                p=c.execute('SELECT id FROM projects WHERE id=? AND user_id=?',(pid,u['id'])).fetchone()
                if not p:return self.send_json(404,{'error':'Project not found.'})
                cur=c.execute('INSERT INTO datasets(project_id,filename,csv_text,rows,columns_count) VALUES(?,?,?,?,?)',(pid,filename,csv_text,len(rows),len(header))); did=cur.lastrowid
            return self.send_json(201,{'dataset':{'id':did,'filename':filename,'rows':len(rows),'columns_count':len(header),'statistics':stats(header,rows)}})
        if path=='/api/preprocess':
            try: pid=int(d.get('datasetId'))
            except: return self.send_json(400,{'error':'Select a dataset first.'})
            with connect() as c: row=c.execute('SELECT d.* FROM datasets d JOIN projects p ON p.id=d.project_id WHERE d.id=? AND p.user_id=?',(pid,u['id'])).fetchone()
            if not row:return self.send_json(404,{'error':'Dataset not found.'})
            try: header,rows=parse_csv(row['csv_text'])
            except ValueError as e:return self.send_json(422,{'error':str(e)})
            method=d.get('missingMethod','mean'); encoding=d.get('encoding','onehot'); scaling=d.get('scaling','none'); target=d.get('target',''); test_size=d.get('testSize',0.2)
            if target and target not in header:return self.send_json(400,{'error':'Selected target column does not exist.'})
            try: test_size=float(test_size)
            except: return self.send_json(400,{'error':'Test split must be a number.'})
            if not 0.1<=test_size<=0.5:return self.send_json(400,{'error':'Test split must be between 10% and 50%.'})
            cleaned=[]; changes=0
            numeric={h:True for h in header}
            for h in header:
                vals=[r[h] for r in rows if r[h]!='']
                try:
                    for v in vals: float(v)
                except: numeric[h]=False
                if not vals:numeric[h]=False
            means={}
            for h in header:
                nums=[]
                if numeric[h]:
                    for r in rows:
                        if r[h]!='':
                            try: nums.append(float(r[h]))
                            except: pass
                means[h]=sum(nums)/len(nums) if nums else 0
            for r in rows:
                nr={}
                for h in header:
                    v=r[h]
                    if v=='':
                        changes+=1
                        if method=='drop': nr[h]=None; continue
                        if method=='mean' and numeric[h]:v=str(means[h])
                        elif method=='mode':
                            vals=[x[h] for x in rows if x[h]!='']; v=max(set(vals),key=vals.count) if vals else 'Unknown'
                        else:v='0' if numeric[h] else 'Unknown'
                    nr[h]=v
                if all(v is not None for v in nr.values()):cleaned.append(nr)
            if not cleaned:return self.send_json(422,{'error':'Missing-value handling removed every row.'})
            output_header=list(header); out=[]
            cat=[h for h in header if not numeric[h] and h!=target]
            if encoding=='onehot':
                for h in cat:
                    cats=sorted(set(r[h] for r in cleaned)); output_header.remove(h)
                    new=[f'{h}_{x}' for x in cats]; output_header.extend(new)
                    for r in cleaned:
                        value=r.pop(h)
                        for col,catval in zip(new,cats):r[col]='1' if value==catval else '0'
                # Keep target categorical intact for model label interpretation.
                if target and target in cat:
                    # target was excluded from cat list above
                    pass
            elif encoding=='label':
                for h in cat:
                    mapping={v:i for i,v in enumerate(sorted(set(r[h] for r in cleaned)))}
                    for r in cleaned:r[h]=str(mapping[r[h]])
            numeric_after={h:True for h in output_header}
            for r in cleaned:
                for h in output_header:
                    try: float(r[h])
                    except: numeric_after[h]=False
            if scaling!='none':
                for h in output_header:
                    if h==target or not numeric_after[h]:continue
                    vals=[float(r[h]) for r in cleaned]; lo=min(vals); hi=max(vals); mean=sum(vals)/len(vals); var=sum((v-mean)**2 for v in vals)/len(vals); sd=math.sqrt(var)
                    for r in cleaned:
                        x=float(r[h]); r[h]=str(round((x-lo)/(hi-lo),6) if scaling=='minmax' and hi!=lo else round((x-mean)/sd,6) if scaling=='standard' and sd else 0 if scaling in ('minmax','standard') else x)
            n=len(cleaned); test_n=max(1,min(n-1,round(n*test_size))) if n>1 else 0
            result={'datasetId':pid,'rowsBefore':len(rows),'rowsAfter':n,'missingValuesHandled':changes,'columnsAfter':output_header,'preview':[{k:r[k] for k in output_header} for r in cleaned[:20]],'target':target or None,'trainRows':n-test_n if target else None,'testRows':test_n if target else None,'testFraction':test_size if target else None,'encoding':encoding,'scaling':scaling,'missingMethod':method,'note':'Preprocessing preview is computed for this request; original uploaded CSV is unchanged. This demonstration prepares/splits data but does not train models (Experiments 4–6 are out of scope).'}
            return self.send_json(200,{'result':result})
        return self.send_json(404,{'error':'Not found'})
    def do_DELETE(self):
        path=urlparse(self.path).path; u=self.require_user()
        if not u:return
        if path.startswith('/api/projects/'):
            try:pid=int(path.split('/')[3])
            except:return self.send_json(400,{'error':'Invalid project ID.'})
            with connect() as c:cur=c.execute('DELETE FROM projects WHERE id=? AND user_id=?',(pid,u['id']))
            return self.send_json(200,{'ok':True}) if cur.rowcount else self.send_json(404,{'error':'Project not found.'})
        return self.send_json(404,{'error':'Not found'})

def main():
    init_db(); host=os.environ.get('MLME_HOST','127.0.0.1'); port=int(os.environ.get('MLME_PORT','8000'))
    print('\nWeb-Based ML Model Evaluator — Sprint 1–3 demo'); print(f'Open http://{host}:{port} in your browser.'); print('Press Ctrl+C to stop.\n')
    ThreadingHTTPServer((host,port),Handler).serve_forever()
if __name__=='__main__': main()

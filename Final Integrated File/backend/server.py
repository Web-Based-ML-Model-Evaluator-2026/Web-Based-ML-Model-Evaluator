"""ModelLab local demo server: auth, projects, datasets, ML experiments, comparison and reports."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
from pathlib import Path
import json, sqlite3, secrets, hashlib, hmac, csv, io, os, traceback
from contextlib import contextmanager
from datetime import datetime, timezone

ROOT=Path(__file__).resolve().parents[1]; DB=ROOT/'database'/'modellab.sqlite3'; FRONT=ROOT/'frontend'; DATA=ROOT/'datasets'/'uploads'; DATA.mkdir(parents=True,exist_ok=True)
MAX_BYTES=5*1024*1024

def now(): return datetime.now(timezone.utc).isoformat()
@contextmanager

def connect():
 c=sqlite3.connect(DB); c.row_factory=sqlite3.Row; c.execute('PRAGMA foreign_keys=ON')
 try:
  yield c; c.commit()
 except Exception:
  c.rollback(); raise
 finally: c.close()

def init_db():
 with connect() as c:
  c.executescript('''CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,pw_hash TEXT NOT NULL,created TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,created TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS projects(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,name TEXT NOT NULL,description TEXT DEFAULT '',created TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS datasets(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,filename TEXT NOT NULL,path TEXT NOT NULL,rows_count INTEGER,columns_count INTEGER,created TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS experiments(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,model TEXT NOT NULL,task TEXT NOT NULL,target TEXT NOT NULL,metrics TEXT NOT NULL,config TEXT NOT NULL,created TEXT NOT NULL);
  ''')

def hash_pw(pw,salt=None):
 salt=salt or secrets.token_hex(16); digest=hashlib.pbkdf2_hmac('sha256',pw.encode(),salt.encode(),180000).hex(); return salt+'$'+digest

def check_pw(pw,stored):
 try: salt,d=stored.split('$',1); return hmac.compare_digest(hash_pw(pw,salt).split('$',1)[1],d)
 except Exception:return False

def response_json(handler,status,obj):
 b=json.dumps(obj,allow_nan=False).encode(); handler.send_response(status); handler.send_header('Content-Type','application/json; charset=utf-8'); handler.send_header('Content-Length',str(len(b))); handler.send_header('X-Content-Type-Options','nosniff'); handler.send_header('Cache-Control','no-store'); handler.end_headers(); handler.wfile.write(b)

def csv_data(text):
 if not text.strip(): raise ValueError('CSV file is empty.')
 reader=csv.DictReader(io.StringIO(text)); headers=reader.fieldnames
 if not headers or len(headers)<2: raise ValueError('CSV must contain a header and at least two columns.')
 headers=[str(h).strip() for h in headers]
 if any(not h for h in headers) or len(set(headers))!=len(headers): raise ValueError('Column names must be unique and non-empty.')
 rows=[]
 for i,row in enumerate(reader,2):
  if None in row: raise ValueError(f'Row {i} has extra values.')
  cleaned={h:(row.get(h) or '').strip() for h in headers}
  if any(cleaned.values()): rows.append(cleaned)
 if not rows: raise ValueError('CSV contains no data rows.')
 if len(rows)>100000: raise ValueError('CSV exceeds the 100,000 row limit.')
 return headers,rows

def auth_user(h):
 token=h.headers.get('Authorization','').removeprefix('Bearer ').strip()
 if not token:return None
 with connect() as c: row=c.execute('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?',(token,)).fetchone()
 return dict(row) if row else None

def owned(c,table,ident,user_id): return c.execute(f'SELECT * FROM {table} WHERE id=? AND user_id=?',(ident,user_id)).fetchone()

def metrics_for(y_true,y_pred,task):
 from sklearn.metrics import accuracy_score,precision_score,recall_score,f1_score,confusion_matrix,mean_absolute_error,mean_squared_error,r2_score
 if task=='classification':
  return {'accuracy':round(float(accuracy_score(y_true,y_pred)),4),'precision_weighted':round(float(precision_score(y_true,y_pred,average='weighted',zero_division=0)),4),'recall_weighted':round(float(recall_score(y_true,y_pred,average='weighted',zero_division=0)),4),'f1_weighted':round(float(f1_score(y_true,y_pred,average='weighted',zero_division=0)),4),'confusion_matrix':confusion_matrix(y_true,y_pred).tolist()}
 return {'mae':round(float(mean_absolute_error(y_true,y_pred)),4),'rmse':round(float(mean_squared_error(y_true,y_pred)**0.5),4),'r2':round(float(r2_score(y_true,y_pred)),4) if len(y_true)>1 else None}

def run_model(csv_text,target,task,model_name,test_size,missing,encoding,scaling,seed=42):
 import pandas as pd
 from sklearn.model_selection import train_test_split
 from sklearn.compose import ColumnTransformer
 from sklearn.pipeline import Pipeline
 from sklearn.impute import SimpleImputer
 from sklearn.preprocessing import OneHotEncoder,OrdinalEncoder,StandardScaler,MinMaxScaler
 from sklearn.metrics import classification_report
 from sklearn.linear_model import LogisticRegression,LinearRegression
 from sklearn.tree import DecisionTreeClassifier,DecisionTreeRegressor
 from sklearn.ensemble import RandomForestClassifier,RandomForestRegressor,GradientBoostingClassifier,GradientBoostingRegressor
 from sklearn.svm import SVC,SVR
 headers,rows=csv_data(csv_text); df=pd.DataFrame(rows)
 if target not in df.columns: raise ValueError('Target column not found.')
 if df[target].nunique(dropna=True)<2: raise ValueError('Target must contain at least two distinct values.')
 df=df.replace('',pd.NA)
 if missing=='drop': df=df.dropna()
 if df.empty: raise ValueError('No rows remain after missing-value handling.')
 X=df.drop(columns=[target]); y=df[target]
 if task not in ('classification','regression'): raise ValueError('Task must be classification or regression.')
 if task=='regression':
  y=pd.to_numeric(y,errors='coerce'); valid=y.notna(); X=X.loc[valid]; y=y.loc[valid]
 else: y=y.astype(str)
 if len(y)<5: raise ValueError('At least 5 valid rows are required for training and testing.')
 stratify=y if task=='classification' and y.value_counts().min()>=2 else None
 X_train,X_test,y_train,y_test=train_test_split(X,y,test_size=float(test_size),random_state=seed,stratify=stratify)
 num_cols=X.select_dtypes(include=['number']).columns.tolist(); cat_cols=[x for x in X.columns if x not in num_cols]
 impute_strategy= 'mean' if missing=='mean' else 'most_frequent'
 num_steps=[('imputer',SimpleImputer(strategy=impute_strategy))]
 if scaling=='standard': num_steps.append(('scaler',StandardScaler()))
 elif scaling=='minmax': num_steps.append(('scaler',MinMaxScaler()))
 num_pipe=Pipeline(num_steps)
 cat_encoder=OrdinalEncoder(handle_unknown='use_encoded_value',unknown_value=-1) if encoding=='label' else OneHotEncoder(handle_unknown='ignore')
 cat_pipe=Pipeline([('imputer',SimpleImputer(strategy='most_frequent')),('encoder',cat_encoder)])
 pre=ColumnTransformer([('numeric',num_pipe,num_cols),('categorical',cat_pipe,cat_cols)],remainder='drop')
 models={
 'Logistic Regression':LogisticRegression(max_iter=1000),'Decision Tree':DecisionTreeClassifier(random_state=seed),
 'Random Forest':RandomForestClassifier(n_estimators=120,random_state=seed),'Gradient Boosting':GradientBoostingClassifier(random_state=seed),'SVM':SVC(),
 'Linear Regression':LinearRegression(),'Decision Tree Regressor':DecisionTreeRegressor(random_state=seed),
 'Random Forest Regressor':RandomForestRegressor(n_estimators=120,random_state=seed),'Gradient Boosting Regressor':GradientBoostingRegressor(random_state=seed),'SVR':SVR()}
 if model_name not in models: raise ValueError('Unsupported model selection.')
 if task=='classification' and model_name not in ['Logistic Regression','Decision Tree','Random Forest','Gradient Boosting','SVM']: raise ValueError('Choose a classification model for classification.')
 if task=='regression' and model_name not in ['Linear Regression','Decision Tree Regressor','Random Forest Regressor','Gradient Boosting Regressor','SVR']: raise ValueError('Choose a regression model for regression.')
 pipe=Pipeline([('preprocessor',pre),('model',models[model_name])]); pipe.fit(X_train,y_train); pred=pipe.predict(X_test)
 met=metrics_for(y_test,pred,task)
 return {'metrics':met,'train_rows':len(X_train),'test_rows':len(X_test),'feature_count':len(X.columns),'target':target,'task':task,'model':model_name,'classes':sorted(y.astype(str).unique().tolist()) if task=='classification' else [],'predictions':[{'actual':str(a),'predicted':str(p)} for a,p in zip(y_test.tolist()[:100],pred.tolist()[:100])], 'config':{'test_size':test_size,'missing':missing,'encoding':encoding,'scaling':scaling,'seed':seed}}

class Handler(BaseHTTPRequestHandler):
 def body(self):
  n=int(self.headers.get('Content-Length','0'))
  if n<=0 or n>MAX_BYTES+100000:return {}
  return json.loads(self.rfile.read(n).decode())
 def send_json(self,s,o):response_json(self,s,o)
 def do_OPTIONS(self): self.send_response(204); self.send_header('Access-Control-Allow-Origin','*'); self.send_header('Access-Control-Allow-Headers','Content-Type, Authorization'); self.send_header('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS'); self.end_headers()
 def do_GET(self):
  path=urlparse(self.path).path
  if path=='/api/health':return self.send_json(200,{'status':'ok','service':'ModelLab'})
  if path=='/' or path.startswith('/static/'): 
   file=FRONT/'index.html' if path=='/' else FRONT/path.removeprefix('/static/')
   if not file.exists():return self.send_json(404,{'error':'Not found'})
   data=file.read_bytes(); self.send_response(200); self.send_header('Content-Type','text/html; charset=utf-8' if file.suffix=='.html' else 'text/javascript; charset=utf-8' if file.suffix=='.js' else 'text/css; charset=utf-8'); self.send_header('Content-Length',str(len(data))); self.end_headers(); self.wfile.write(data); return
  user=auth_user(self)
  if not user:return self.send_json(401,{'error':'Please sign in.'})
  with connect() as c:
   if path=='/api/me':return self.send_json(200,{'id':user['id'],'name':user['name'],'email':user['email']})
   if path=='/api/projects':return self.send_json(200,[dict(x) for x in c.execute('SELECT id,name,description,created FROM projects WHERE user_id=? ORDER BY id DESC',(user['id'],))])
   if path=='/api/datasets':return self.send_json(200,[dict(x) for x in c.execute('SELECT id,project_id,filename,rows_count,columns_count,created FROM datasets WHERE user_id=? ORDER BY id DESC',(user['id'],))])
   if path.startswith('/api/datasets/') and path.endswith('/content'):
    did=int(path.split('/')[3]); ds=owned(c,'datasets',did,user['id'])
    if not ds:return self.send_json(404,{'error':'Dataset not found.'})
    return self.send_json(200,{'csv':Path(ds['path']).read_text(encoding='utf-8-sig'),'filename':ds['filename']})
   if path=='/api/experiments':
    arr=[]
    for x in c.execute('SELECT * FROM experiments WHERE user_id=? ORDER BY id DESC',(user['id'],)):
     d=dict(x); d['metrics']=json.loads(d['metrics']);d['config']=json.loads(d['config']);arr.append(d)
    return self.send_json(200,arr)
  return self.send_json(404,{'error':'Not found'})

 def do_POST(self):
  path=urlparse(self.path).path
  try: p=self.body()
  except Exception:return self.send_json(400,{'error':'Invalid JSON request.'})
  try:
   if path=='/api/register':
    name=str(p.get('name','')).strip(); email=str(p.get('email','')).strip().lower(); pw=str(p.get('password',''))
    if not name or '@' not in email or len(pw)<8:return self.send_json(400,{'error':'Enter a name, valid email, and password with at least 8 characters.'})
    token=secrets.token_urlsafe(32)
    with connect() as c:
     cur=c.execute('INSERT INTO users(name,email,pw_hash,created) VALUES(?,?,?,?)',(name,email,hash_pw(pw),now())); uid=cur.lastrowid;c.execute('INSERT INTO sessions VALUES(?,?,?)',(token,uid,now()))
    return self.send_json(201,{'token':token,'user':{'id':uid,'name':name,'email':email}})
   if path=='/api/login':
    email=str(p.get('email','')).strip().lower();pw=str(p.get('password',''))
    with connect() as c: u=c.execute('SELECT * FROM users WHERE email=?',(email,)).fetchone()
    if not u or not check_pw(pw,u['pw_hash']):return self.send_json(401,{'error':'Email or password is incorrect.'})
    token=secrets.token_urlsafe(32)
    with connect() as c:c.execute('INSERT INTO sessions VALUES(?,?,?)',(token,u['id'],now()))
    return self.send_json(200,{'token':token,'user':{'id':u['id'],'name':u['name'],'email':u['email']}})
   user=auth_user(self)
   if not user:return self.send_json(401,{'error':'Please sign in.'})
   if path=='/api/logout':
    with connect() as c:c.execute('DELETE FROM sessions WHERE token=?',(self.headers.get('Authorization','').removeprefix('Bearer '),))
    return self.send_json(200,{'ok':True})
   if path=='/api/projects':
    name=str(p.get('name','')).strip()
    if not name:return self.send_json(400,{'error':'Project name is required.'})
    with connect() as c: cur=c.execute('INSERT INTO projects(user_id,name,description,created) VALUES(?,?,?,?)',(user['id'],name,str(p.get('description','')).strip(),now())); pid=cur.lastrowid
    return self.send_json(201,{'id':pid,'name':name,'description':p.get('description','')})
   if path=='/api/datasets/upload':
    pid=int(p.get('project_id',0)); filename=Path(str(p.get('filename','dataset.csv'))).name
    text=str(p.get('csv',''))
    if len(text.encode())>MAX_BYTES:return self.send_json(413,{'error':'CSV limit is 5 MB.'})
    headers,rows=csv_data(text)
    with connect() as c:
     if not owned(c,'projects',pid,user['id']):return self.send_json(404,{'error':'Project not found.'})
     cur=c.execute('INSERT INTO datasets(user_id,project_id,filename,path,rows_count,columns_count,created) VALUES(?,?,?,?,?,?,?)',(user['id'],pid,filename,'',len(rows),len(headers),now())); did=cur.lastrowid
    pathfile=DATA/f'user{user["id"]}_dataset{did}.csv'; pathfile.write_text(text,encoding='utf-8')
    with connect() as c:c.execute('UPDATE datasets SET path=? WHERE id=?',(str(pathfile),did))
    return self.send_json(201,{'id':did,'filename':filename,'rows':len(rows),'columns':len(headers),'headers':headers,'preview':rows[:8]})
   if path=='/api/experiments/run':
    did=int(p.get('dataset_id',0)); model=str(p.get('model',''));target=str(p.get('target',''));task=str(p.get('task','classification'));pid=int(p.get('project_id',0))
    with connect() as c:
     ds=owned(c,'datasets',did,user['id'])
     if not ds:return self.send_json(404,{'error':'Dataset not found.'})
     if pid and not owned(c,'projects',pid,user['id']):return self.send_json(404,{'error':'Project not found.'})
    csv_text=Path(ds['path']).read_text(encoding='utf-8-sig')
    result=run_model(csv_text,target,task,model,float(p.get('test_size',0.2)),str(p.get('missing','mean')),str(p.get('encoding','onehot')),str(p.get('scaling','standard')))
    with connect() as c:cur=c.execute('INSERT INTO experiments(user_id,project_id,dataset_id,model,task,target,metrics,config,created) VALUES(?,?,?,?,?,?,?,?,?)',(user['id'],pid or ds['project_id'],did,model,task,target,json.dumps(result['metrics']),json.dumps(result['config']),now())); eid=cur.lastrowid
    result.update({'id':eid,'dataset_id':did,'project_id':pid or ds['project_id'],'created':now()});return self.send_json(201,result)
   if path=='/api/reports':
    ids=p.get('experiment_ids',[])
    if not isinstance(ids,list) or not ids:return self.send_json(400,{'error':'Select at least one experiment.'})
    with connect() as c:
     records=[]
     for eid in ids:
      row=owned(c,'experiments',int(eid),user['id'])
      if row:
       d=dict(row);d['metrics']=json.loads(d['metrics']);d['config']=json.loads(d['config']);records.append(d)
    if not records:return self.send_json(404,{'error':'No matching experiments found.'})
    return self.send_json(200,{'title':'ModelLab Experiment Report','generated':now(),'experiments':records})
  except ValueError as e:return self.send_json(400,{'error':str(e)})
  except sqlite3.IntegrityError:return self.send_json(409,{'error':'That email is already registered.'})
  except Exception as e:
   traceback.print_exc();return self.send_json(500,{'error':'Server error: '+str(e)})
 def log_message(self,fmt,*args):print('[ModelLab]',fmt%args)

def main():
 init_db(); host=os.environ.get('HOST','127.0.0.1');port=int(os.environ.get('PORT','8000'));print(f'ModelLab running at http://{host}:{port}');ThreadingHTTPServer((host,port),Handler).serve_forever()
if __name__=='__main__':main()

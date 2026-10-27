import sys, tempfile, unittest, threading, json, urllib.request, urllib.error, os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'app'))
import server

class CoreTests(unittest.TestCase):
 def test_csv_stats(self):
  h,r=server.parse_csv('a,b\n1,x\n, y\n')
  self.assertEqual(h,['a','b']); self.assertEqual(len(r),2)
  s=server.stats(h,r); self.assertEqual(s['missingCells'],1); self.assertEqual(s['rowCount'],2)
 def test_reject_empty_bad_duplicate_ragged(self):
  for content in ['', 'a,b\n', 'a,A\n1,2\n', 'a,b\n1\n']:
   with self.subTest(content=content), self.assertRaises(ValueError):server.parse_csv(content)
 def test_password_hash_salted(self):
  salt='ab'*16; self.assertEqual(server.pw_hash('password123',salt),server.pw_hash('password123',salt)); self.assertNotEqual(server.pw_hash('password123',salt),server.pw_hash('password124',salt))

class ApiTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.tmp=tempfile.TemporaryDirectory(); server.DB=Path(cls.tmp.name)/'test.sqlite3'; server.SESSIONS.clear(); server.init_db(); cls.http=server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler); cls.thread=threading.Thread(target=cls.http.serve_forever,daemon=True); cls.thread.start(); cls.base='http://127.0.0.1:'+str(cls.http.server_port)
 @classmethod
 def tearDownClass(cls):cls.http.shutdown();cls.http.server_close();cls.tmp.cleanup()
 def req(self,path,data=None,cookie=None,method=None):
  raw=json.dumps(data).encode() if data is not None else None; req=urllib.request.Request(self.base+path,data=raw,method=method,headers={'Content-Type':'application/json',**({'Cookie':cookie} if cookie else {})})
  try:r=urllib.request.urlopen(req)
  except urllib.error.HTTPError as e:r=e
  return r.code,json.loads(r.read()),r.headers
 def test_register_login_project_dataset_preview_preprocess(self):
  code,d,h=self.req('/api/register',{'name':'Test User','email':'test@example.com','password':'Password123'});self.assertEqual(code,201);cookie=h.get('Set-Cookie').split(';')[0]
  code,d,_=self.req('/api/projects',{'name':'Test Project','description':'Test'},cookie);self.assertEqual(code,201);pid=d['project']['id']
  csv='age,city,target\n20,A,Yes\n, B,No\n40,A,Yes\n'
  code,d,_=self.req('/api/datasets',{'projectId':pid,'filename':'test.csv','csvText':csv},cookie);self.assertEqual(code,201);did=d['dataset']['id']
  code,d,_=self.req('/api/datasets/'+str(did),cookie=cookie);self.assertEqual(code,200);self.assertEqual(d['dataset']['statistics']['rowCount'],3)
  code,d,_=self.req('/api/preprocess',{'datasetId':did,'missingMethod':'mean','encoding':'onehot','scaling':'minmax','target':'target','testSize':0.2},cookie);self.assertEqual(code,200);self.assertEqual(d['result']['rowsAfter'],3);self.assertEqual(d['result']['trainRows']+d['result']['testRows'],3)
 def test_auth_required_and_invalid_csv(self):
  code,_,_=self.req('/api/projects');self.assertEqual(code,401)
  code,d,_=self.req('/api/register',{'name':'Test User','email':'badcsv@example.com','password':'Password123'});cookie='mlme_session='+self._token_from_email('badcsv@example.com')
  # use cookie captured in actual flow instead of extracting token from server session
  self.assertEqual(code,201)
  code,d,_=self.req('/api/datasets',{'projectId':999,'filename':'x.csv','csvText':'a,b\n1\n'},cookie);self.assertEqual(code,422)
 def _token_from_email(self,email):
  uid=None
  with server.connect() as c:uid=c.execute('SELECT id FROM users WHERE email=?',(email,)).fetchone()['id']
  for token,session_uid in server.SESSIONS.items():
   if session_uid==uid:return token
  return ''

if __name__=='__main__':unittest.main(verbosity=2)

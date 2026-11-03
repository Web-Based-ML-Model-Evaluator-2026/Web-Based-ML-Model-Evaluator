import sys, tempfile, threading, unittest, json
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
import server

CLASS_CSV='age,income,city,label\n20,30000,A,No\n25,40000,B,No\n30,50000,A,No\n35,60000,B,Yes\n40,70000,A,Yes\n45,80000,B,Yes\n50,90000,A,Yes\n55,100000,B,Yes\n60,110000,A,Yes\n65,120000,B,Yes\n'
REG_CSV='area,rooms,zone,price\n800,2,A,140000\n900,2,B,160000\n1000,3,A,180000\n1100,3,B,200000\n1200,3,A,220000\n1300,4,B,240000\n1400,4,A,260000\n1500,4,B,280000\n1600,5,A,300000\n1700,5,B,320000\n'
class E2E(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.tmp=tempfile.TemporaryDirectory(); server.DB=Path(cls.tmp.name)/'db.sqlite';server.DATA=Path(cls.tmp.name)/'uploads';server.DATA.mkdir();server.init_db()
  cls.http=server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler);cls.port=cls.http.server_address[1];cls.thread=threading.Thread(target=cls.http.serve_forever,daemon=True);cls.thread.start();cls.base=f'http://127.0.0.1:{cls.port}'
 @classmethod
 def tearDownClass(cls):cls.http.shutdown();cls.http.server_close();cls.tmp.cleanup()
 def req(self,path,method='GET',data=None,token=None):
  body=json.dumps(data).encode() if data is not None else None;headers={'Content-Type':'application/json'}
  if token:headers['Authorization']='Bearer '+token
  req=Request(self.base+path,data=body,headers=headers,method=method)
  try:
   with urlopen(req) as r:return r.status,json.loads(r.read())
  except HTTPError as e:return e.code,json.loads(e.read())
 def test_health(self):self.assertEqual(self.req('/api/health')[1]['status'],'ok')
 def test_register_duplicate_and_login(self):
  s,d=self.req('/api/register','POST',{'name':'Test User','email':'test@example.com','password':'testpassword'});self.assertEqual(s,201);self.token=d['token']
  self.assertEqual(self.req('/api/register','POST',{'name':'X','email':'test@example.com','password':'testpassword'})[0],409)
  self.assertEqual(self.req('/api/login','POST',{'email':'test@example.com','password':'wrongpass'})[0],401)
  self.assertEqual(self.req('/api/login','POST',{'email':'test@example.com','password':'testpassword'})[0],200)
 def test_project_dataset_and_classification_experiment(self):
  _,u=self.req('/api/register','POST',{'name':'ML User','email':'ml@example.com','password':'password123'});t=u['token']
  _,p=self.req('/api/projects','POST',{'name':'Classification Demo','description':'test'},t)
  _,d=self.req('/api/datasets/upload','POST',{'project_id':p['id'],'filename':'tiny.csv','csv':CLASS_CSV},t)
  self.assertEqual(d['rows'],10)
  s,r=self.req('/api/experiments/run','POST',{'project_id':p['id'],'dataset_id':d['id'],'target':'label','task':'classification','model':'Decision Tree','test_size':.3,'missing':'mean','encoding':'onehot','scaling':'standard'},t)
  self.assertEqual(s,201);self.assertIn('accuracy',r['metrics']);self.assertEqual(r['test_rows'],3)
  self.assertEqual(self.req('/api/experiments',token=t)[0],200)
 def test_regression_training(self):
  result=server.run_model(REG_CSV,'price','regression','Linear Regression',.2,'mean','onehot','standard')
  self.assertIn('rmse',result['metrics']);self.assertEqual(result['task'],'regression')
 def test_ordinal_encoding_training(self):
  result=server.run_model(CLASS_CSV,'label','classification','Random Forest',.3,'mean','label','minmax')
  self.assertIn('f1_weighted',result['metrics'])
 def test_csv_validation(self):
  with self.assertRaises(ValueError):server.csv_data('')
  with self.assertRaises(ValueError):server.csv_data('a,a\n1,2\n')
if __name__=='__main__':unittest.main()

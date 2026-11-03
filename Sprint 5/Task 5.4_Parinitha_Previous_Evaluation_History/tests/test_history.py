def payload():
    return {"task_type":"classification","model_name":"Random Forest",
            "metrics":{"accuracy":0.94,"f1_score":0.91},
            "hyperparameters":{"n_estimators":100},"dataset_name":"credit.csv"}
def test_save_and_list(client):
    saved=client.post("/api/history",json=payload())
    assert saved.status_code==201
    listed=client.get("/api/history")
    assert listed.status_code==200 and listed.json["count"]==1
def test_get_detail(client):
    record=client.post("/api/history",json=payload()).json["evaluation"]
    assert client.get(f'/api/history/{record["id"]}').json["evaluation"]["model_name"]=="Random Forest"
def test_missing_record(client):
    assert client.get("/api/history/999").status_code==404
def test_invalid_payload(client):
    assert client.post("/api/history",json={"task_type":"bad"}).status_code==400
def test_bad_pagination(client):
    assert client.get("/api/history?limit=500").status_code==400

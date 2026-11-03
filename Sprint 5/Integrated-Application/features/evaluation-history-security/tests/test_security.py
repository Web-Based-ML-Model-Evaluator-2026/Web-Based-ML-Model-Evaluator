import io
def test_reject_txt(client):
    response=client.post("/api/security/validate-csv",data={"file":(io.BytesIO(b"x"),"file.txt")},content_type="multipart/form-data")
    assert response.status_code==400
def test_reject_empty_csv(client):
    response=client.post("/api/security/validate-csv",data={"file":(io.BytesIO(b""),"empty.csv")},content_type="multipart/form-data")
    assert response.status_code==400
def test_accept_csv(client):
    response=client.post("/api/security/validate-csv",data={"file":(io.BytesIO(b"a,b\n1,2\n"),"ok.csv")},content_type="multipart/form-data")
    assert response.status_code==200
def test_api_key_guard(app):
    app.config["API_ACCESS_KEY"]="test-key"
    client=app.test_client()
    assert client.get("/api/history").status_code==401
    assert client.get("/api/history",headers={"X-API-Key":"test-key"}).status_code==200

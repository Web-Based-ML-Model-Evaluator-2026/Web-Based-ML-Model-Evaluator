import io
import os
import unittest
from server import app

class Sprint2ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.created = []

    def tearDown(self):
        from safe_storage import UPLOAD_DIR
        for name in self.created:
            path = os.path.join(UPLOAD_DIR, name)
            if os.path.exists(path):
                os.remove(path)

    def test_health(self):
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['status'], 'ok')

    def test_validation_rejects_bad_header(self):
        response = self.client.post('/api/validate-dataset', data={
            'file': (io.BytesIO(b',score\nAlice,10\n'), 'bad.csv')
        }, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json['valid'])
        self.assertTrue(response.json['errors'])

    def test_upload_then_preview(self):
        response = self.client.post('/api/upload-dataset', data={
            'file': (io.BytesIO(b'name,score\nAlice,10\nBob,20\n'), 'people.csv')
        }, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 201, response.json)
        self.created.append(response.json['stored_name'])
        file_id = response.json['file_id']
        self.assertNotIn('file_path', response.json)
        preview = self.client.get(f'/api/datasets/{file_id}/preview')
        self.assertEqual(preview.status_code, 200, preview.json)
        self.assertEqual(preview.json['totalRows'], 2)
        self.assertEqual(preview.json['columns'], ['name', 'score'])
        self.assertEqual(preview.json['rows'][0]['name'], 'Alice')

    def test_preview_rejects_invalid_id(self):
        self.assertEqual(self.client.get('/api/datasets/../../preview').status_code, 404)

if __name__ == '__main__':
    unittest.main()

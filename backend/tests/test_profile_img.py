import requests

token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzg5MjMxMjczLCJpYXQiOjE3ODkyMjc2NzMsImp0aSI6ImZmNDg3OTQxZWNhODRhM2JhYjcxZGU1MTg2NzRlYWQ5IiwidXNlcl9pZCI6IjIzIn0.2o5CqNEm7Rw4tggepL2reSFWAekBivL3UvNYBnVnjb8'

with open('dummy.jpg', 'rb') as f:
    r = requests.patch('http://127.0.0.1:8000/api/patient/profile/', headers={'Authorization': f'Bearer {token}'}, files={'profileImage': f})
    
print(r.status_code)
print(r.json())

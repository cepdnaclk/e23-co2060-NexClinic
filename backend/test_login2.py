import requests
import json

token_url = "http://127.0.0.1:8000/api/users/token/"
payload = {"email": "cmind6654@gmail.com", "password": "testpassword123"}
print(requests.post(token_url, json=payload).text)

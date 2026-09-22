import requests
import json
login_url = "http://127.0.0.1:8000/api/users/login/"
payload = {"email": "cmind6654@gmail.com", "password": "testpassword123"}
try:
    resp = requests.post(login_url, json=payload)
    tokens = resp.json()
    cookies = {"authToken": tokens["access"], "refreshToken": tokens["refresh"]}
    nextjs_url = "http://localhost:3000/api/patient/profile"
    res = requests.get(nextjs_url, cookies=cookies)
    print(res.text)
except Exception as e:
    print(e)

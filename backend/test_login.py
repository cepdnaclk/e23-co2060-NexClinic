import requests
login_url = "http://127.0.0.1:8000/api/users/login/"
payload = {"email": "cmind6654@gmail.com", "password": "testpassword123"}
print(requests.post(login_url, json=payload).text)

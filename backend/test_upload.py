import requests

with open("test.jpg", "wb") as f:
    f.write(b"fake image data")

files = {'profileImage': open("test.jpg", "rb")}
data = {'fullName': 'Test Name'}

# Simulate a direct request to the Django backend
response = requests.patch("http://localhost:8000/api/patient/profile/", files=files, data=data)
print(response.status_code)
print(response.text)

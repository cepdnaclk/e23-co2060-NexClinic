import urllib.request, json
url='http://127.0.0.1:8000/api/users/doctor/login/'
payload={'email':'testdoc@example.com','password':''}
data=json.dumps(payload).encode('utf-8')
req=urllib.request.Request(url, data=data, headers={'Content-Type':'application/json'})
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        print(resp.status)
        print(resp.read().decode('utf-8'))
except Exception as e:
    import traceback
    import urllib.error
    if isinstance(e, urllib.error.HTTPError):
        try:
            print('HTTP', e.code)
            print(e.read().decode())
        except Exception:
            traceback.print_exc()
    else:
        traceback.print_exc()
    raise

import urllib.request
try:
    res = urllib.request.urlopen('https://qubuyvgmtnelvifgctep.supabase.co/storage/v1/object/public/nexclinic-public/patient_profiles/mine.png', timeout=5)
    print('Status:', res.status)
except Exception as e:
    print(e.read().decode())

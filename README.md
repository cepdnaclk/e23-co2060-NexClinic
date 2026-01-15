```
NexClinic/
│
├── frontend/
├── backend/
├── docs/
├── docker-compose.yml
└── README.md
```

---
```
frontend/
│
├── public/
│ └── index.html
│
├── src/
│ ├── api/
│ │ ├── axios.js
│ │ ├── auth.api.js
│ │ ├── doctor.api.js
│ │ └── appointment.api.js
│ │
│ ├── components/
│ │ ├── common/
│ │ ├── forms/
│ │ └── layout/
│ │
│ ├── pages/
│ │ ├── auth/
│ │ ├── patient/
│ │ ├── doctor/
│ │ └── admin/
│ │
│ ├── routes/
│ │ └── ProtectedRoutes.jsx
│ │
│ ├── context/
│ │ └── AuthContext.jsx
│ │
│ ├── hooks/
│ │ └── useAuth.js
│ │
│ ├── utils/
│ │ └── constants.js
│ │
│ ├── App.jsx
│ └── main.jsx
│
└── package.json
```
---
```
backend/
│
├── config/
│ ├── settings.py
│ ├── urls.py
│ ├── celery.py
│ └── wsgi.py
│
├── users/
│ ├── models.py
│ ├── serializers.py
│ ├── views.py
│ ├── permissions.py
│ └── urls.py
│
├── doctors/
│ ├── models.py
│ ├── serializers.py
│ ├── views.py
│ └── urls.py
│
├── appointments/
│ ├── models.py
│ ├── serializers.py
│ ├── views.py
│ └── urls.py
│
├── reminders/
│ ├── models.py
│ ├── tasks.py
│ └── services.py
│
├── notifications/
│ ├── email.py
│ ├── sms.py
│ └── push.py
│
├── common/
│ ├── utils.py
│ ├── validators.py
│ └── constants.py
├──ai/
| ├── services/
| ├── views.py
| └── urls.py
│
├── manage.py
└── requirements.txt
```

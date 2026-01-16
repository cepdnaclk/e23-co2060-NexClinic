from django.db import models

# Create your models here.
class Patient(models.Model):
    full_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10)
    phone = models.CharField(max_length=15)
    address = models.CharField(max_length=100)
    email = models.CharField(max_length=100)
    
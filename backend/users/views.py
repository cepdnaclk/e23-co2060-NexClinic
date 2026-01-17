from rest_framework import generics
from rest_framework.permissions import AllowAny
from .serializers import PatientRegistrationSerializer, DoctorRegistrationSerializer

class PatientRegisterView(generics.CreateAPIView):
    serializer_class = PatientRegistrationSerializer
    permission_classes = [AllowAny]

class DoctorRegisterView(generics.CreateAPIView):
    serializer_class = DoctorRegistrationSerializer
    permission_classes = [AllowAny]

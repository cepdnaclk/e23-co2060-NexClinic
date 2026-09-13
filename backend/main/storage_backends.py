from django.conf import settings
from django.core.files.storage import FileSystemStorage

if getattr(settings, 'USE_S3', False):
    from storages.backends.s3boto3 import S3Boto3Storage

    class PublicMediaStorage(S3Boto3Storage):
        location = ''
        file_overwrite = False
        querystring_auth = False # Public links don't expire
        
        @property
        def bucket_name(self):
            return getattr(settings, 'AWS_PUBLIC_STORAGE_BUCKET_NAME', 'nexclinic-public')

        @property
        def custom_domain(self):
            import re
            endpoint = getattr(settings, 'AWS_S3_ENDPOINT_URL', '')
            match = re.search(r'//([^.]+)\.storage\.supabase\.co', endpoint)
            if match:
                project_ref = match.group(1)
                return f"{project_ref}.supabase.co/storage/v1/object/public/{self.bucket_name}"
            return None

    class PrivateMediaStorage(S3Boto3Storage):
        location = ''
        file_overwrite = False
        querystring_auth = True # Private links require signature
        
        @property
        def bucket_name(self):
            return getattr(settings, 'AWS_PRIVATE_STORAGE_BUCKET_NAME', 'nexclinic-private')
else:
    class PublicMediaStorage(FileSystemStorage):
        pass

    class PrivateMediaStorage(FileSystemStorage):
        pass

public_storage = PublicMediaStorage()
private_storage = PrivateMediaStorage()

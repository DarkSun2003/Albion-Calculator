"""
URL configuration for albion_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.contrib import admin
from django.http import FileResponse, HttpResponse
from django.urls import path, include, re_path
import mimetypes


def serve_frontend(request, resource=''):
    """
    Serves the built React frontend (frontend/dist) directly from Django.
    Allows running the entire calculator as a single lightweight Python process
    on older laptops without needing Node.js / Vite running in the background.
    """
    dist_dir = getattr(settings, 'FRONTEND_DIST_DIR', None)
    if dist_dir and dist_dir.exists():
        if resource:
            target = (dist_dir / resource).resolve()
            if str(target).startswith(str(dist_dir.resolve())) and target.is_file():
                content_type, _ = mimetypes.guess_type(str(target))
                return FileResponse(open(target, 'rb'), content_type=content_type or 'application/octet-stream')
        index_file = dist_dir / 'index.html'
        if index_file.is_file():
            return FileResponse(open(index_file, 'rb'), content_type='text/html')
    return HttpResponse(
        "Albion Artisan API is running. (To view the Desktop UI here, run 'npm run build' in /frontend).",
        content_type="text/plain",
    )


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('calculator.urls')),
    re_path(r'^(?P<resource>.*)$', serve_frontend),
]

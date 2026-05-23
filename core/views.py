import json
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST

from .models import User, Rol, Producto


# ── Auth ──────────────────────────────────────────────────────────────

def login_view(request):
    if request.user.is_authenticated:
        return redirect('index')
    return render(request, 'core/login.html')


@require_POST
def api_login(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'ok': False, 'error': 'Petición inválida'}, status=400)

    email = data.get('email', '').strip()
    password = data.get('password', '')
    user = authenticate(request, username=email, password=password)
    if user:
        login(request, user)
        return JsonResponse({'ok': True})
    return JsonResponse({'ok': False, 'error': 'Email o contraseña incorrectos'}, status=401)


@require_POST
def api_register(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'ok': False, 'error': 'Petición inválida'}, status=400)

    email = data.get('email', '').strip()
    password = data.get('password', '')
    nombre = data.get('nombre', '').strip()
    telefono = data.get('telefono', '').strip()
    calle = data.get('calle', '').strip()
    colonia = data.get('colonia', '').strip()
    num_casa = data.get('num_casa', '').strip()

    if User.objects.filter(email=email).exists():
        return JsonResponse({'ok': False, 'error': 'Ese email ya está registrado'}, status=400)

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=nombre,
        telefono=telefono,
        calle=calle,
        colonia=colonia,
        num_casa=num_casa,
    )
    Rol.objects.create(user=user, nombre_rol=Rol.CLIENTE)
    return JsonResponse({'ok': True})


def logout_view(request):
    logout(request)
    return redirect('login')


# ── Pages ─────────────────────────────────────────────────────────────

@login_required
def index_view(request):
    return render(request, 'core/index.html')


@login_required
def menu_view(request):
    productos = [
        {
            'id': p.id,
            'nombre': p.nombre,
            'descripcion': p.descripcion or '',
            'precio_base': float(p.precio_base),
        }
        for p in Producto.objects.filter(activo=True)
    ]
    return render(request, 'core/menu.html', {
        'productos_json': json.dumps(productos, ensure_ascii=False),
    })

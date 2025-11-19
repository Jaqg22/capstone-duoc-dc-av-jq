from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.db import transaction


class Command(BaseCommand):
    help = 'Crea grupos de usuarios y usuarios de ejemplo para RindeBus'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-users',
            action='store_true',
            help='Crear usuarios de ejemplo además de los grupos',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🚀 Configurando sistema de permisos RindeBus...')
        )

        try:
            with transaction.atomic():
                # Crear grupos
                self.create_groups()
                
                # Crear usuarios si se solicita
                if options['create_users']:
                    self.create_example_users()
                
                self.stdout.write(
                    self.style.SUCCESS('✅ Sistema de permisos configurado exitosamente')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error configurando permisos: {str(e)}')
            )

    def create_groups(self):
        """Crear grupos con permisos específicos"""
        
        # 👑 GRUPO: Administradores
        admin_group, created = Group.objects.get_or_create(name='Administradores')
        if created:
            self.stdout.write('📋 Creado grupo: Administradores')
        
        # Todos los permisos para administradores
        admin_permissions = Permission.objects.all()
        admin_group.permissions.set(admin_permissions)
        self.stdout.write(f'   ➜ Asignados {admin_permissions.count()} permisos')

        # 👨‍💼 GRUPO: Supervisores
        supervisor_group, created = Group.objects.get_or_create(name='Supervisores')
        if created:
            self.stdout.write('📋 Creado grupo: Supervisores')
        
        supervisor_permissions = Permission.objects.filter(
            codename__in=[
                # Planillas - gestión completa
                'add_planilla', 'change_planilla', 'view_planilla',
                'can_approve_planilla', 'can_reject_planilla',
                'can_view_all_planillas', 'can_export_planillas',
                'can_view_reports',
                
                # Empleados - solo lectura y gestión
                'view_empleado', 'change_empleado', 'add_empleado',
                'can_view_employee_reports', 'can_manage_conductores',
                'can_manage_asistentes',
                
                # Buses y ciudades - gestión completa
                'add_bus', 'change_bus', 'view_bus',
                'add_ciudad', 'change_ciudad', 'view_ciudad',
                
                # Cargos - solo lectura
                'view_cargo',
            ]
        )
        supervisor_group.permissions.set(supervisor_permissions)
        self.stdout.write(f'   ➜ Asignados {supervisor_permissions.count()} permisos')

        # 👨‍💻 GRUPO: Operadores
        operator_group, created = Group.objects.get_or_create(name='Operadores')
        if created:
            self.stdout.write('📋 Creado grupo: Operadores')
        
        operator_permissions = Permission.objects.filter(
            codename__in=[
                # Planillas - crear y editar propias
                'add_planilla', 'change_planilla', 'view_planilla',
                
                # Empleados - solo lectura
                'view_empleado',
                
                # Buses y ciudades - solo lectura
                'view_bus', 'view_ciudad', 'view_cargo',
            ]
        )
        operator_group.permissions.set(operator_permissions)
        self.stdout.write(f'   ➜ Asignados {operator_permissions.count()} permisos')

        # 👁️ GRUPO: Solo Lectura
        readonly_group, created = Group.objects.get_or_create(name='Solo Lectura')
        if created:
            self.stdout.write('📋 Creado grupo: Solo Lectura')
        
        # Solo permisos de lectura
        readonly_permissions = Permission.objects.filter(
            codename__startswith='view_'
        )
        readonly_group.permissions.set(readonly_permissions)
        self.stdout.write(f'   ➜ Asignados {readonly_permissions.count()} permisos')

    def create_example_users(self):
        """Crear usuarios de ejemplo"""
        self.stdout.write('\n👥 Creando usuarios de ejemplo...')
        
        users_data = [
            {
                'username': 'admin_rindebus',
                'email': 'admin@rindebus.cl',
                'first_name': 'Administrador',
                'last_name': 'Sistema',
                'password': 'Admin123!',
                'is_superuser': True,
                'is_staff': True,
                'groups': ['Administradores']
            },
            {
                'username': 'supervisor_juan',
                'email': 'supervisor@rindebus.cl',
                'first_name': 'Juan',
                'last_name': 'Pérez',
                'password': 'Super123!',
                'is_superuser': False,
                'is_staff': True,
                'groups': ['Supervisores']
            },
            {
                'username': 'operador_maria',
                'email': 'operador@rindebus.cl',
                'first_name': 'María',
                'last_name': 'González',
                'password': 'Opera123!',
                'is_superuser': False,
                'is_staff': True,
                'groups': ['Operadores']
            },
            {
                'username': 'consulta_carlos',
                'email': 'consulta@rindebus.cl',
                'first_name': 'Carlos',
                'last_name': 'López',
                'password': 'Lectura123!',
                'is_superuser': False,
                'is_staff': True,
                'groups': ['Solo Lectura']
            }
        ]

        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'is_superuser': user_data['is_superuser'],
                    'is_staff': user_data['is_staff'],
                }
            )
            
            if created:
                user.set_password(user_data['password'])
                user.save()
                
                # Asignar grupos
                for group_name in user_data['groups']:
                    group = Group.objects.get(name=group_name)
                    user.groups.add(group)
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Usuario creado: {user.username} ({user.first_name} {user.last_name})'
                    )
                )
                self.stdout.write(f'   📧 Email: {user.email}')
                self.stdout.write(f'   🔑 Password: {user_data["password"]}')
                self.stdout.write(f'   👤 Grupos: {", ".join(user_data["groups"])}')
                self.stdout.write('')
            else:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  Usuario ya existe: {user.username}')
                )

        self.stdout.write(
            self.style.SUCCESS('\n🎉 ¡Usuarios creados exitosamente!')
        )
        self.stdout.write('📌 Puedes acceder a Django Admin en: http://127.0.0.1:8080/admin/')
        self.stdout.write('📌 Usa cualquiera de los usuarios creados para probar')
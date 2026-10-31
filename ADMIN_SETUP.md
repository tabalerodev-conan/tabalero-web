# Configuración del panel de agenda

El panel usa Supabase Auth para iniciar sesión y PostgreSQL Row Level Security (RLS) para proteger las escrituras. Ocultar `admin.html` no es una medida de seguridad: las políticas de la base son las que impiden que otros usuarios cambien la agenda.

## Preparar Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta el contenido de `supabase.sql` desde **SQL Editor**.
3. En **Authentication → Users**, crea o invita la cuenta administradora. No habilites el registro público.
4. Copia el UUID de esa cuenta y autorízala en SQL Editor:

   ```sql
   insert into public.show_admins (user_id)
   values ('REEMPLAZAR-POR-EL-UUID-DEL-USUARIO');
   ```

5. En **Project Settings → API**, copia la URL del proyecto y la clave pública `anon`/publishable en `supabase-config.js`.

   La clave pública puede estar en el navegador; **nunca** pongas la clave `service_role` en este sitio.

6. Configura el dominio HTTPS publicado en **Authentication → URL Configuration** y habilita MFA para la cuenta administradora como protección adicional.

## Uso

- Abre `admin.html`, inicia sesión con la cuenta autorizada y agrega o elimina fechas.
- La página pública consulta `public.shows`; los cambios de escritura se rechazan en la base salvo que el usuario autenticado esté en `public.show_admins`.
- Mientras `supabase-config.js` tenga valores de ejemplo, la web conserva las fechas ilustrativas y el panel no permite iniciar sesión.
- Publica los archivos por HTTPS. No uses `file://` para probar Auth; utiliza un servidor local o el hosting final.

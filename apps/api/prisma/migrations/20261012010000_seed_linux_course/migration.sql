-- Curso semilla: Linux para novatos (contenido fuente: tools/seed-course/linux-course.py)
-- Ids fijos + ON CONFLICT DO NOTHING: re-ejecutar no duplica.

-- Curso
INSERT INTO "courses" (id, title, slug, description, subtitle, level, duration, lessons_count, status, cover_image, position, learning_points, requirements, target_audience, created_at, updated_at) VALUES
('cur-linux-novatos-000001', 'Linux para novatos: de cero a tu primer servidor', 'linux-para-novatos', 'Aprende Linux desde cero: qué es, cómo usar la terminal, permisos, usuarios, paquetes, procesos, redes, scripts Bash y tu primer servidor SSH. Todo práctico, sin conocimientos previos.', 'El curso que te lleva de no haber tocado Linux a moverte por la terminal y administrar tu propio servidor con confianza.', 'BEGINNER', '6 h 15 min', 33, 'AVAILABLE', NULL, 1, ARRAY['Entender qué es Linux, el kernel y por qué domina los servidores', 'Usar la terminal sin miedo: navegar, crear y manipular archivos', 'Gestionar usuarios, grupos y permisos de forma segura', 'Instalar, buscar y actualizar software con gestores de paquetes', 'Administrar procesos y servicios con systemd', 'Escribir tus primeros scripts en Bash con variables y condiciones', 'Conectarte por SSH a servidores remotos']::TEXT[], ARRAY['Una computadora con al menos 4 GB de RAM y 20 GB de disco libre', 'Ningún conocimiento previo de Linux', 'Ganas de practicar: en Linux se aprende escribiendo comandos']::TEXT[], 'Personas sin experiencia en Linux que quieren empezar como desarrolladores, administradores de sistemas o simplemente dominar la herramienta más usada en servidores.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;


-- Módulos y clases
-- Módulo: Introducción a Linux y sus ideas
INSERT INTO "course_modules" (id, course_id, title, description, position, created_at, updated_at) VALUES
('cmod-01-introduccion', 'cur-linux-novatos-000001', 'Introducción a Linux y sus ideas', 'Qué es Linux, de dónde viene y por qué es el sistema operativo de los servidores, el desarrollo y el mundo moderno.', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-01-que-es-linux', 'cmod-01-introduccion', '¿Qué es Linux y por qué importa?', 'que-es-linux', NULL, 'VIDEO', 'https://www.youtube.com/watch?v=-DHBjIE-ZGE', 'YOUTUBE', 'Bienvenido al curso. Antes de escribir un solo comando necesitas entender qué es Linux y por qué está en todas partes: en tu celular Android, en los servidores de Google y Netflix, en las nubes y hasta en tu router.

## Qué es Linux

Linux es un **sistema operativo**: el software que administra los recursos de tu computadora y te permite ejecutar programas. Pero a diferencia de Windows o macOS, Linux tiene una historia particular: en realidad es **el kernel** (el núcleo) que acuñó Linus Torvalds en 1991, y la mayor parte de las herramientas que lo acompañan provienen del proyecto **GNU**, iniciado por Richard Stallman en 1983. Por eso técnicamente se llama *GNU/Linux*.

> 💡 **Idea clave:** Linux no es una empresa ni un producto único. Es un kernel de código abierto que cualquiera puede ver, modificar y distribuir.

## Por qué domina los servidores

- **Estabilidad:** los servidores Linux pueden pasar años sin reiniciarse.
- **Seguridad:** permisos estrictos, auditoría y una comunidad enorme revisando el código.
- **Gratis y abierto:** sin licencias por equipo; puedes instalarlo en cualquier máquina.
- **Flexibilidad:** usas solo lo que necesitas, desde un router hasta un clúster de supercomputadoras.

## Kernel vs. sistema operativo

El **kernel** es la parte que habla directamente con el hardware: CPU, memoria, discos, red. Encima del kernel se apoya todo lo demás: la terminal, el entorno gráfico, los programas. La mayoría de las "distribuciones" (Ubuntu, Debian, Fedora) comparten el mismo kernel Linux pero empaquetan distintas herramientas.

## ¿Por dónde empezar?

Este curso está pensado para que **practiques**. Leer sin escribir comandos no sirve: abre una terminal, equivócate, rompe cosas en una máquina virtual y arréglalas. Así se aprende Linux de verdad.

## Práctica sugerida

Instala una máquina virtual (verás cómo en el módulo 1) y navega por el sistema con `ls`, `cd` y `pwd` mientras ves el video. No necesitas entenderlo todo aún: la repetición construye memoria muscular. ', 12, '[{"label": "Kernel Linux (sitio oficial)", "url": "https://kernel.org"}, {"label": "Proyecto GNU", "url": "https://www.gnu.org"}]'::jsonb, true, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-02-kernel-y-gnu', 'cmod-01-introduccion', 'El kernel y GNU: la historia detrás del pingüino', 'kernel-y-gnu', NULL, 'ARTICLE', NULL, 'YOUTUBE', 'Para usar Linux con criterio conviene conocer su historia. No se trata de nostalgia: esa historia explica por qué el sistema se organiza como se organiza hoy.

## De Unix a Linux

Unix nació en 1969 en los laboratorios Bell de AT&T. Era elegante y poderoso, pero propietario y carísimo. En 1983, Richard Stallman lanzó el proyecto **GNU** (*GNU''s Not Unix*) con un objetivo ambicioso: crear un sistema operativo completo con software libre. GNU aportó el compilador `gcc`, las utilidades `bash`, `coreutils` y decenas de herramientas, pero le faltaba el núcleo.

Ese núcleo llegó en 1991, cuando **Linus Torvalds**, un estudiante finlandés, publicó el kernel Linux en internet invitando a colaborar. La combinación fue explosiva: el kernel de Linus + las herramientas GNU = un sistema operativo libre y completo.

## Qué es el software libre

La **licencia GPL** garantiza cuatro libertades:

1. Usar el programa para cualquier propósito.
2. Estudiar y modificar el código fuente.
3. Redistribuir copias.
4. Mejorar el programa y publicar las mejoras.

> 💡 **Idea clave:** "Linux es gratis como una cerveza gratis, pero libre como libertad de expresión". Puedes pagar por él (soporte, servicios) y aun así seguir siendo libre.

## Cómo conviven kernel y usuarios

Cuando escribes un comando, este se ejecuta en **modo usuario**; cuando el sistema necesita tocar el hardware, pide servicio al kernel a través de **llamadas al sistema** (*syscalls*). Esta separación protege la estabilidad: un programa que falla no puede tumbar el kernel.

## Las capas de un sistema Linux

```
┌──────────────────────────────┐
│  Aplicaciones (navegador,    │
│  servidor web, juegos...)    │
├──────────────────────────────┤
│  Herramientas GNU (bash, ls, │
│  grep, gcc, coreutils...)    │
├──────────────────────────────┤
│  Kernel Linux (memoria, CPU, │
│  discos, red, drivers...)    │
├──────────────────────────────┤
│  Hardware                    │
└──────────────────────────────┘
```

## Práctica sugerida

Comprueba la versión de tu kernel con `uname -r` y la información completa con `uname -a`. Si estás en una máquina virtual, compara la versión del kernel del host y del invitado: son independientes. ', 11, '[{"label": "Historia de GNU (GNU.org)", "url": "https://www.gnu.org/gnu/gnu-history.html"}, {"label": "Linus Torvalds en Wikipedia", "url": "https://es.wikipedia.org/wiki/Linus_Torvalds"}]'::jsonb, true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-03-distribuciones', 'cmod-01-introduccion', 'Distribuciones: cuál elegir y por qué', 'distribuciones', NULL, 'ARTICLE', NULL, 'YOUTUBE', 'Una **distribución** (distro) es un empaquetado completo: kernel + herramientas + gestor de paquetes + aplicaciones + instalador. Es la forma práctica de conseguir Linux funcionando sin compilar nada.

## La familia Debian

- **Debian**: estable, comunitaria, la base de muchísimos sistemas. Ideal para servidores.
- **Ubuntu**: basada en Debian, amigable para escritorio y la más popular en la nube. Muchos tutoriales la usan como referencia.
- **Linux Mint**: basada en Ubuntu, pensada para quienes vienen de Windows, con escritorio cómodo desde el primer minuto.

## La familia Red Hat

- **Fedora**: innovadora, con las novedades más recientes; gran opción de escritorio para curiosos.
- **RHEL / Rocky / AlmaLinux**: orientadas a empresas y servidores críticos. La certificación Linux más conocida (RHCSA) se hace sobre esta familia.

## La familia Arch

- **Arch Linux**: instalación mínima, filosofía "hazlo tú mismo" y gestor `pacman`. Aprendes muchísimo, pero no es para el primer día.
- **EndeavourOS / Manjaro**: te dan la base de Arch con instalador amigable.

> 💡 **Consejo para novatos:** empieza con **Ubuntu** o **Linux Mint** para el escritorio y **Debian** o **Ubuntu Server** para practicar servidores. Son las mejor documentadas: cualquier error que tengas ya tuvo un millón de personas antes, y la respuesta está en la web.

## ¿Importa cuál eliges?

Al principio, casi nada: los comandos que aprenderás (`ls`, `cd`, `grep`, `systemctl`, `ssh`) funcionan igual en todas. Lo que cambia es el **gestor de paquetes**:

| Familia | Gestor | Instalar un paquete |
|---|---|---|
| Debian/Ubuntu | `apt` | `sudo apt install git` |
| Fedora/RHEL | `dnf` | `sudo dnf install git` |
| Arch | `pacman` | `sudo pacman -S git` |
| openSUSE | `zypper` | `sudo zypper install git` |

## Práctica sugerida

Entra en [distrowatch.com](https://distrowatch.com) y mira las 10 distribuciones más populares del mes. Elige una, descarga su ISO y tenla lista para el módulo siguiente, donde la instalaremos en una máquina virtual. ', 13, '[{"label": "DistroWatch", "url": "https://distrowatch.com"}, {"label": "Descargar Ubuntu", "url": "https://ubuntu.com/download"}, {"label": "Descargar Debian", "url": "https://www.debian.org/distrib/"}]'::jsonb, true, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-04-instalar-linux-en-vm', 'cmod-01-introduccion', 'Instala Linux en una máquina virtual (guía paso a paso)', 'instalar-linux-en-vm', NULL, 'PRACTICE', NULL, 'YOUTUBE', 'La forma más segura de aprender Linux es romper cosas sin consecuencias: una **máquina virtual (VM)** es una computadora completa dentro de tu computadora, y si la dañas, la borras y creas otra. Además, esto te prepara para el mundo real: los servidores en la nube son, en esencia, máquinas virtuales.

## Opción A: VirtualBox (gratis, en tu PC)

1. Descarga e instala [VirtualBox](https://www.virtualbox.org) y la ISO de **Ubuntu Desktop** o **Linux Mint**.
2. Crea una VM: 4 GB de RAM, 25 GB de disco, 2 CPU.
3. Arranca con la ISO, elige *Try or Install Ubuntu* y sigue el asistente.
4. Termina, reinicia y ya tienes Linux funcionando.

## Opción B: en tu servidor Proxmox (como un profesional)

Si tienes un homelab con Proxmox (como el de este sitio), crea una VM o un contenedor LXC:

1. Sube la ISO de Ubuntu Server a `local > ISO Images`.
2. *Create VM*: 2 vCPU, 2-4 GB RAM, disco de 20-32 GB, bridge `vmbr0`.
3. Instala sin entorno gráfico: **esto es lo que encontrará en un servidor real**.
4. Configura una IP estática o DHCP y anota la IP.

## Después de instalar

Actualiza el sistema (los comandos corresponden a la familia Debian):

```bash
sudo apt update
sudo apt full-upgrade
```

> 💡 **Tip del profesor:** si quieres empezar en serio, elige Ubuntu **Server** (sin escritorio). Te obligará a vivir en la terminal desde el día uno, y ese es el camino más rápido para sentirte cómodo en Linux.

## Práctica

1. Instala tu distribución.
2. Ejecuta `ping google.com` y confirma que tienes red.
3. Ejecuta `free -h`, `df -h` y `nproc` y anota cuánta RAM, disco y CPU tiene tu máquina virtual.
4. Toma un *snapshot* de la VM: a partir de ahora puedes romper lo que quieras y volver atrás. ', 15, '[{"label": "Descargar VirtualBox", "url": "https://www.virtualbox.org/wiki/Downloads"}, {"label": "Guía oficial de instalación de Ubuntu", "url": "https://ubuntu.com/tutorials/install-ubuntu-desktop"}]'::jsonb, true, true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-05-escritorio-vs-terminal', 'cmod-01-introduccion', 'Escritorio vs. terminal: cuándo usar cada uno', 'escritorio-vs-terminal', NULL, 'ARTICLE', NULL, 'YOUTUBE', 'En Linux conviven dos mundos: el **escritorio gráfico** (ventanas, iconos, ratón) y la **terminal** (línea de comandos, texto, teclado). Los dos son válidos; la diferencia es para qué sirve cada uno.

## El escritorio: rapidez para tareas visuales

- Navegar archivos con el explorador de archivos.
- Editar imágenes, ver videos, navegar la web.
- Configurar Wi-Fi y pantallas con asistentes gráficos.

## La terminal: poder y automatización

- **Repetible:** escribes una vez, ejecutas mil veces.
- **Remota:** el escritorio casi nunca viaja por red; la terminal sí (SSH).
- **Automatizable:** puedes encadenar comandos y programar tareas.
- **Ligera:** un servidor sin escritorio usa mucha menos RAM y CPU.
- **Universal:** los mismos comandos funcionan en cualquier servidor del planeta.

> 💡 **Tip del profesor:** no hace falta "aprender de memoria" cada comando. La terminal se aprende como un idioma: primero frases útiles (`ls`, `cd`, `cat`), después gramática (opciones, tuberías) y finalmente estilo (scripts).

## La regla práctica

Usa **siempre la terminal cuando la tarea sea repetitiva o remotas**. Si solo vas a renombrar una foto, el explorador de archivos está bien. Si vas a renombrar 300 fotos, la terminal te cambia la vida:

```bash
# ejemplo: numerar todas las fotos del directorio
i=1; for f in IMG_*.jpg; do mv "$f" "foto_$i.jpg"; i=$((i+1)); done
```

## Ejercicio rápido

Abre la terminal y ejecuta `history` para ver tu historial de comandos. Cada comando que escribas queda registrado: esa lista, al final del curso, será el mapa de todo lo que aprendiste. ', 10, NULL, true, true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;


-- Módulo: La terminal: tu nueva casa
INSERT INTO "course_modules" (id, course_id, title, description, position, created_at, updated_at) VALUES
('cmod-02-terminal', 'cur-linux-novatos-000001', 'La terminal: tu nueva casa', 'Los comandos esenciales para moverte, crear y manipular archivos. Aquí empieza la magia: todo lo que haces con el ratón, lo harás más rápido con teclado.', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-06-primeros-comandos', 'cmod-02-terminal', 'Primeros comandos: pwd, ls, cd', 'primeros-comandos', NULL, 'VIDEO', 'https://www.youtube.com/watch?v=UBkjlvx6sSw', 'YOUTUBE', 'Respira hondo: la terminal no es difícil, solo es diferente. Hoy aprendes los tres comandos con los que vivirás el resto de tu carrera en Linux.

## pwd — ¿dónde estoy?

`pwd` (*print working directory*) muestra la ruta del directorio en el que estás:

```bash
$ pwd
/home/kevin
```

## ls — ¿qué hay aquí?

`ls` (*list*) muestra los archivos y carpetas del directorio actual:

```bash
ls            # lista simple
ls -l         # lista con detalles (permisos, tamaño, fecha)
ls -a         # incluye archivos ocultos (los que empiezan con .)
ls -lh        # detalles con tamaños legibles
```

## cd — muévete

`cd` (*change directory*) cambia de directorio:

```bash
cd Documentos     # entra a Documentos
cd ..             # sube un nivel
cd ../..            # sube dos niveles
cd ~              # va a tu carpeta personal (home)
cd /etc           # ruta absoluta: desde la raíz /
cd -              # vuelve al directorio anterior
```

> 💡 **Tip del profesor:** usa las rutas **relativas** (sin `/` al inicio) para moverte entre cercanos y las **absolutas** (con `/` al inicio) cuando quieras ir a un lugar fijo sin importar desde dónde sales.

## Los tres juntos

```bash
pwd                      # ¿dónde estoy?
ls                       # ¿qué hay?
cd Documentos && ls    # entra y lista en un solo comando
```

El `&&` encadena comandos: el segundo solo corre si el primero tuvo éxito. Lo usarás muchísimo.

## Práctica

1. Navega desde tu home hasta `/usr/bin` con `cd`.
2. Ejecuta `ls | head -20` (sí, ese `|` es una tubería, ya la dominarás) y mira qué hay en `usr/bin`.
3. Intenta `cd /root` a secas: verás un error de permisos. Ese error te enseña más que mil tutoriales: los permisos existen. ', 12, '[{"label": "Referencia de comandos (GNU coreutils)", "url": "https://www.gnu.org/software/coreutils/manual/"}]'::jsonb, true, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-07-navegar-el-sistema', 'cmod-02-terminal', 'El sistema de archivos: el árbol de Linux', 'navegar-el-sistema', NULL, 'ARTICLE', NULL, 'YOUTUBE', 'Linux organiza todo en **un solo árbol** que cuelga de la raíz `/`. No existen "unidades C:"; cada disco o partición se *monta* en una carpeta dentro de ese árbol.

## Directorios que debes conocer

| Directorio | Contenido |
|---|---|
| `/` | Raíz del sistema. Todo cuelga de aquí. |
| `/home` | Las carpetas personales de los usuarios (`/home/kevin`). |
| `/root` | Carpeta personal del administrador (root). |
| `/etc` | Configuración del sistema y de los programas. |
| `/usr` | Programas instalados y sus librerías. |
| `/var` | Datos variables: logs, colas, bases de datos. |
| `/tmp` | Archivos temporales, se vacían al reiniciar. |
| `/bin`, `/sbin` | Ejecutables esenciales del sistema. |
| `/dev` | Dispositivos: discos, USB, terminales. |
| `/proc` | "Fotos" del sistema en vivo (CPU, memoria, procesos). |

## Explorando

```bash
ls /etc/ssh            # configuración del servidor SSH
cat /etc/os-release    # ¿qué distribución estoy usando?
cat /proc/meminfo | head -3   # memoria del sistema en vivo
ls -lh /var/log        # logs del sistema
```

> 💡 **Tip del profesor:** `cat /etc/os-release` y `uname -a` son las dos respuestas que empiezo a buscar cuando alguien dice "no me funciona algo en Linux".

## Home vs. raíz

Tu **home** (`~`) es tu territorio: archivos personales, configuraciones, proyectos. La **raíz** (`/`) es de todos: ahí viven los directorios del sistema. No borres nada fuera de tu home hasta saber qué es: *"si no sabes qué hace, no lo borres"* es la ley número uno del administrador.

## Práctica

Recorre los directorios de la tabla, uno por uno, con `cd` + `ls`. Para cada uno, anota: ¿qué hay dentro? ¿Puedes escribir en él? (prueba `touch /etc/archivo_prueba` y observa el error). ', 12, '[{"label": "Filesystem Hierarchy Standard", "url": "https://es.wikipedia.org/wiki/Filesystem_Hierarchy_Standard"}]'::jsonb, true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-08-archivos-y-directorios', 'cmod-02-terminal', 'Crear, copiar, mover y borrar: touch, mkdir, cp, mv, rm', 'archivos-y-directorios', NULL, 'ARTICLE', NULL, 'YOUTUBE', 'Nada te hará sentir más poderoso que mover cientos de archivos con una línea. Estos son los comandos fundamentales.

## Crear

```bash
touch notas.txt                 # crea un archivo vacío (o actualiza su fecha)
mkdir proyectos                 # crea una carpeta
mkdir -p web/css web/js         # crea la estructura completa a la vez
```

## Copiar y mover

```bash
cp notas.txt respaldo.txt       # copia un archivo
cp -r web web-copia             # copia una carpeta completa (recursivo)
mv notas.txt /home/kevin/Docs   # mueve a otra carpeta
mv viejo.txt nuevo.txt          # también sirve para renombrar
```

## Borrar (¡con cuidado!)

```bash
rm archivo.txt                  # borra un archivo
rm -r carpeta                   # borra una carpeta y todo su contenido
rm -rf carpeta                  # borra sin pedir confirmación
```

> ⚠️ **Atención:** en la terminal **no hay papelera**. `rm` borra para siempre. La tripleta `rm -rf` es la responsable de más de un desastre; úsala solo cuando estés 100% seguro y revisa dos veces la ruta.

## Comodines (`*` y `?`)

```bash
rm *.tmp                        # borra todos los .tmp
cp foto-*.jpg /backup/          # copia todos los que matcheen
touch archivo{1..5}.txt         # crea archivo1..archivo5.txt
```

## Práctica

1. Crea `~/laboratorio` y dentro `fotos/` y `docs/`.
2. Crea 10 archivos `foto_1.txt` ... `foto_10.txt` con un bucle:
   ```bash
   for i in $(seq 1 10); do touch fotos/foto_$i.txt; done
   ```
3. Cópialos todos con `cp fotos/*.txt docs/`.
4. Renombra uno con `mv` y bórralo con `rm`.
5. Ahora, destruye todo: `rm -rf ~/laboratorio` y siente el poder (y el miedo sano). ', 14, NULL, true, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-09-leer-archivos', 'cmod-02-terminal', 'Leer archivos sin abrirlos: cat, less, head, tail', 'leer-archivos', NULL, 'ARTICLE', NULL, 'YOUTUBE', 'En Linux casi todo es un archivo de texto: configuraciones, logs, listas. Saber leerlos sin abrir un editor te hace brutalmente más rápido.

## cat — vuelca el archivo

```bash
cat /etc/hostname        # el nombre de tu máquina
cat notas.txt
```

## less — para archivos grandes

`less` abre una página a la vez y te deja navegar (flechas, `PgUp/PgDn`, `/` para buscar, `q` para salir):

```bash
less /var/log/syslog
less /etc/services
```

## head y tail — los extremos

```bash
head -20 /etc/passwd     # las primeras 20 líneas (los usuarios del sistema)
tail -20 /var/log/syslog # las últimas 20 líneas (lo más reciente)
tail -f /var/log/syslog  # ¡en vivo! se queda mirando cómo crece el log
```

> 💡 **Tip del profesor:** `tail -f` en un log + abrir otra terminal para reproducir el problema es el patrón con el que los administradores encuentran errores. Domínalo y ya no eres novato.

## Juntos y mezclados

```bash
cat /etc/passwd | grep kevin    # encuentra al usuario kevin
tail -100 /var/log/syslog | grep -i error   # últimos errores
```

## Práctica

1. Mira quién es el "dueño" del sistema: `head -5 /etc/passwd`.
2. Cuenta cuántos usuarios hay: `wc -l /etc/passwd`.
3. Observa los logs de tu sistema en vivo con `tail -f /var/log/syslog` (o `journalctl -f` si tu distro usa journald). Abre otro terminal y ejecuta cualquier comando: verás actividad en el log. ', 8, NULL, true, true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-10-man-y-la-ayuda', 'cmod-02-terminal', 'man y la ayuda integrada: aprende a aprender', 'man-y-la-ayuda', NULL, 'ARTICLE', NULL, 'YOUTUBE', 'No necesitas memorizar nada: necesitas saber **cómo preguntarle al sistema**. Linux trae la mejor documentación integrada de todos los sistemas operativos.

## man — el manual

```bash
man ls          # manual completo de ls
man cp
man -k copy     # busca comandos que hablen de "copy"
```

Dentro de `man`: `q` sale, `/` busca, las flechas navegan. Cada manual tiene la misma estructura: nombre, sinopsis (la sintaxis), descripción, opciones y ejemplos.

## Otras ayudas rápidas

```bash
ls --help       # ayuda resumida (la mayoría de comandos la tiene)
info ls         # manual alternativo, más extenso
apropos nombre  # busca en las descripciones de todos los manuales
```

> 💡 **Tip del profesor:** la operación más infravalorada de Linux es `man comando`. Cuando un estudiante me dice "no entiendo ese comando", la respuesta siempre empieza por: `man esa-cosa`.

## Lectura sintáctica

En la sinopsis de `man`:

- `ls [OPCIONES]... [ARCHIVO]...` → los corchetes son opcionales, los `...` significan "uno o más".
- `-a`, `-l`, `--all` → opción corta, opción corta, opción larga (más legible).

## Práctica

Elige un comando que usarás esta semana (por ejemplo `tar`) y estudia su `man` completo. Anota tres opciones que no conocías. Repite esta práctica con cada comando nuevo del curso: es el hábito que separa a quien "usa Linux" de quien lo "entiende". ', 6, NULL, true, true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-11-autocompletar-historico-atajos', 'cmod-02-terminal', 'Autocompletar, historial y atajos que te hacen rápido', 'autocompletar-historico-atajos', NULL, 'ARTICLE', NULL, 'YOUTUBE', 'La terminal recompensa a los perezosos: cuanto menos escribas, mejor.

## Tab: autocompletar

Escribe `cd Docu` y pulsa **Tab** → se completa solo. Pulsa Tab dos veces para ver todas las opciones. Esto evita errores de escritura y te enseña los nombres exactos de los archivos.

## Historial

```bash
history                 # lista tus comandos anteriores
history | grep docker   # busca comandos de docker que usaste
!!
!123                    # repite el comando #123 del historial
Ctrl+R                  # búsqueda inversa interactiva (¡el rey!)
```

## Atajos de teclado esenciales

| Atajo | Acción |
|---|---|
| `Ctrl+U` | Borra toda la línea |
| `Ctrl+W` | Borra la palabra anterior |
| `Ctrl+A` / `Ctrl+E` | Ir al inicio / final de la línea |
| `Ctrl+L` | Limpiar pantalla (como `clear`) |
| `Ctrl+C` | Cancelar el comando en ejecución |
| `Ctrl+D` | Cerrar la sesión de terminal |
| `Ctrl+R` | Buscar en el historial |

> 💡 **Tip del profesor:** `Ctrl+R` es el atajo con mejor retorno de inversión de toda la terminal. Hazte adicto: escribe dos letras y el comando que buscabas aparece solo.

## Alias: tu propio vocabulario

```bash
alias ll=''ls -lah''
alias update=''sudo apt update && sudo apt full-upgrade''
workon() { cd ~/proyectos/$1; }
```

Para que sobrevivan al reinicio, guárdalos en `~/.bashrc` (o `~/.zshrc`).

## Práctica

1. Ejecuta 5 comandos seguidos y recupera el segundo con `!2` (o el que corresponda a tu historial).
2. Practica `Ctrl+R` para encontrar un comando antiguo.
3. Crea dos alias en `~/.bashrc`, reinicia la terminal y verifícalos. ', 6, NULL, true, true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;


-- Módulo: Usuarios y permisos: quién puede hacer qué
INSERT INTO "course_modules" (id, course_id, title, description, position, created_at, updated_at) VALUES
('cmod-03-permisos', 'cur-linux-novatos-000001', 'Usuarios y permisos: quién puede hacer qué', 'La seguridad de Linux se basa en permisos finos. Aprende a controlar quién lee, escribe y ejecuta cada archivo.', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-12-usuarios-y-grupos', 'cmod-03-permisos', 'Usuarios y grupos: la identidad del sistema', 'usuarios-y-grupos', NULL, 'VIDEO', 'https://www.youtube.com/watch?v=KhbM0BQ3_ew', 'YOUTUBE', 'Linux es multiusuario desde el día uno. Todo proceso corre como **un usuario** concreto, y eso determina qué puede y qué no puede tocar.

## El archivo /etc/passwd

Cada usuario del sistema es una línea:

```bash
cat /etc/passwd
# kevin:x:1000:1000:Kevin Carmen:/home/kevin:/bin/bash
```

Campos: usuario · contraseña (la `x` indica que está en `/etc/shadow`) · UID · GID · nombre · home · shell.

## Crear y gestionar usuarios

```bash
sudo useradd -m -s /bin/bash ana    # crea el usuario ana con su home
sudo passwd ana                     # le pone contraseña
sudo usermod -aG sudo ana           # la agrega al grupo sudo (administradores)
sudo userdel -r ana                 # la borra junto con su home
```

## Grupos: permisos en manada

```bash
groups                 # mis grupos
sudo groupadd devs     # crea el grupo devs
sudo usermod -aG devs kevin   # agrega a kevin al grupo devs
```

> 💡 **Tip del profesor:** cuando un compañero necesita acceder a un proyecto, el flujo correcto es: crear grupo, meter al usuario en el grupo y cambiar el grupo de la carpeta (`sudo chgrp -R devs proyecto/`). Nunca entregues acceso dando permisos a "todos".

## Ver quién soy y quién está

```bash
whoami      # ¿qué usuario soy?
id          # mi UID, GID y grupos
who         # ¿quién está conectado?
last        # historial de inicios de sesión
```

## Práctica en tu máquina virtual

1. Crea un segundo usuario con su home y contraseña.
2. Conviértelo en administrador y entra con `su - usuario`.
3. Comprueba que no puede leer la home de tu usuario principal: `ls /home/kevin` → error de permisos. Ahí está la seguridad de Linux actuando. ', 12, '[{"label": "Guía de usuarios y grupos (Ubuntu)", "url": "https://ubuntu.com/server/docs/security-users"}]'::jsonb, true, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-13-permisos-rwx', 'cmod-03-permisos', 'Los permisos rwx: lee la primera columna de ls -l', 'permisos-rwx', NULL, 'ARTICLE', NULL, 'YOUTUBE', 'Ejecuta `ls -l` en tu home y mira la primera columna:

```text
-rwxr-xr--  1 kevin devs  4096 oct 12 10:00 script.sh
drwxr-xr-x  2 kevin devs  4096 oct 12 10:00 proyectos
```

## Decodificando

El primer carácter es el tipo (`-` archivo, `d` directorio, `l` enlace). Los 9 siguientes son tres tríos:

```
 rwx  r-x  r--        r  = lectura (4)
 dueño grupo otros    w  = escritura (2)
                      x  = ejecución (1)
```

Para **directorios** el significado cambia: `r` = listar contenido, `w` = crear/borrar archivos dentro, `x` = poder entrar (`cd`).

## Forma numérica (octal)

Cada trío es una suma: `rwx` = 4+2+1 = **7**, `r-x` = 4+1 = **5**, `r--` = **4**.

| Número | Significado |
|---|---|
| `755` | dueño: todo · grupo/otros: leer y ejecutar (clásico para carpetas) |
| `644` | dueño: leer/escribir · resto: leer (clásico para archivos) |
| `600` | solo el dueño (archivos sensibles) |
| `700` | solo el dueño, ni siquiera listable para otros |

## La práctica

```bash
ls -l /etc/shadow    # el archivo de contraseñas: legible solo por root
```

> 💡 **Tip del profesor:** cuando veas que algo "no funciona pero no sé por qué", mira primero los permisos con `ls -l`. Ocho de cada diez veces, la respuesta está en esa primera columna.

## Práctica

Ejecuta `ls -l /usr/bin` y encuentra: un binario con permisos `755`, uno con setuid (`-rwsr-xr-x`), y un enlace simbólico (empieza con `l`). El típico setuid es `passwd`: ¿por qué un archivo que cambia contraseñas necesita ejecutarse como root? Piensa en esta pregunta, la respuesta está en el módulo de procesos. ', 13, '[{"label": "Manual de chmod (GNU)", "url": "https://www.gnu.org/software/coreutils/manual/html_node/chmod-invocation.html"}]'::jsonb, true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-14-chmod-y-chown', 'cmod-03-permisos', 'chmod y chown: cambia dueños y permisos', 'chmod-y-chown', NULL, 'VIDEO', 'https://www.youtube.com/watch?v=0OYLjqxJdcU', 'YOUTUBE', 'Ya lees los permisos; ahora los cambias.

## chmod — cambiar permisos

Modo numérico (absoluto y predecible):

```bash
chmod 755 script.sh       # dueño todo, resto leer+ejecutar
chmod 600 secretos.txt    # solo yo
chmod -R 750 proyecto/    # recursivo sobre toda la carpeta
```

Modo simbólico (quirúrgico):

```bash
chmod +x script.sh        # añade ejecución (sin tocar el resto)
chmod u=rw,go=r archivo   # dueño rw, grupo y otros solo lectura
chmod g+w,o-r archivo     # grupo puede escribir, otros no leer
chmod a+x script.sh       # todos ejecutan
```

## chown — cambiar dueño

```bash
sudo chown ana archivo.txt            # el archivo ahora es de ana
sudo chown ana:devs archivo.txt       # dueño ana, grupo devs
sudo chown -R kevin:kevin proyecto/   # recursivo
```

> 💡 **Tip del profesor:** `chmod -R` y `chown -R` sobre `/` o sobre la home de otro usuario son recetas para el desastre. Siempre ancla el comando a la ruta exacta y verifica con `ls -ld` antes y después.

## Convertir un archivo en ejecutable

El caso más común: tienes un script y no corre.

```bash
./mi_script.sh     # error: Permission denied (no es ejecutable)
chmod +x mi_script.sh
./mi_script.sh     # ahora sí
```

Para scripts de Python u otros:

```bash
#!/usr/bin/env python3   # primera línea del archivo (shebang)
chmod +x mi_script.py
./mi_script.py
```

## Práctica

1. Crea `mi_script.sh` con `echo "hola desde linux"`.
2. Observa cómo falla `./mi_script.sh` antes del `chmod`.
3. Aplícale `chmod +x` y ejecútalo.
4. Pruébalo con `chmod 755`, `chmod 700` y `chmod 644` y lee qué cambia en `ls -l` cada vez. ', 14, NULL, true, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-15-root-y-sudo', 'cmod-03-permisos', 'root y sudo: el poder con responsabilidad', 'root-y-sudo', NULL, 'ARTICLE', NULL, 'YOUTUBE', '`root` es el administrador de Linux: puede leer y borrar absolutamente todo. Por eso los sistemas modernos evitan que trabajes como root y te dan `sudo`.

## Por qué sudo y no root

- **Auditoría:** cada comando con `sudo` queda registrado en `/var/log/auth.log`.
- **Cinturón de seguridad:** escribir `sudo` te obliga a pensar "esto es importante".
- **Defensa en profundidad:** si un programa tuyo se compromete, no se lleva las llaves de todo el sistema.

## Uso correcto

```bash
sudo apt install git        # un solo comando elevado
sudo -l                     # ¿qué puedo ejecutar como root?
sudo !!                     # repetir el último comando con sudo
```

El grupo `sudo` (Debian/Ubuntu) o `wheel` (RHEL/Fedora) decide quién puede elevarse:

```bash
sudo usermod -aG sudo kevin
```

## La regla de oro

> ⚠️ **Nunca** trabajes como root por defecto. No hagas `su -` "para estar más cómodo". El momento en que olvides que eres root es exactamente el momento en que `rm -rf /etc` pasa factura. Tú decides tu nivel de poder; el sistema solo recuerda lo que hiciste.

## Reparando el clásico error

¿"file is owned by root"? Es un archivo o carpeta de sistema. Pregúntate: ¿de verdad necesito escribirlo ahí? Si la respuesta es sí (por ejemplo `/etc/hosts`), usa `sudo nano /etc/hosts`. Si es "no", trabaja en tu home. El home existe precisamente para eso.

## Práctica

1. Ejecuta `sudo !!` después de un comando que falló por permisos.
2. Revisa los intentos de acceso: `sudo tail -50 /var/log/auth.log | grep -i sudo`.
3. Reflexiona: ¿qué grupo protege tu máquina de ti mismo? La respuesta está en este módulo. ', 9, NULL, true, true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-16-seguridad-basica', 'cmod-03-permisos', 'Seguridad básica: cierra puertas antes de abrirlas', 'seguridad-basica', NULL, 'ARTICLE', NULL, 'YOUTUBE', 'Un Linux recién instalado es seguro por defecto, pero los servidores expuestos a internet atraen escaneos automáticos desde el primer minuto. Estas son las cinco reglas de oro.

## 1. Contraseñas fuertes y únicas

Los ataques de fuerza bruta existen y funcionan contra contraseñas débiles. Usa frases largas y, en servidores, claves SSH (lo verás en el módulo 7).

## 2. Todo actualizado

```bash
sudo apt update && sudo apt full-upgrade
```

Las actualizaciones no son molestias: son parches de vulnerabilidades. Un servidor sin actualizar es un servidor comprometido.

## 3. Firewall: bloquea por defecto

```bash
sudo ufw default deny incoming
sudo ufw allow 22/tcp     # (o solo tu IP: `allow from tu_ip`)
sudo ufw enable
sudo ufw status
```

Nunca dejes puertos abiertos "por si acaso". Cada puerto abierto es una puerta que alguien puede intentar forzar.

## 4. Menos privilegios

- Trabaja con tu usuario normal, no con root.
- SSH: prohíbe `PermitRootLogin no` y la autenticación por contraseña.
- Instala solo lo que necesitas.

## 5. Habilitar el registro y la auditoría

```bash
sudo journalctl -u ssh --since today   # actividad de SSH hoy
sudo grep "Failed password" /var/log/auth.log | wc -l
```

Si el número de intentos fallidos es alto, tu servidor ya está en los escáneres de internet: no es paranoia, es estadística.

> 💡 **Tip del profesor:** la seguridad no es un producto, es una serie de hábitos: actualizar, cerrar puertos, menos privilegios, vigilar logs. Practícalos en tu máquina virtual antes de tocarlos en producción.

## Práctica

1. Activa `ufw` en tu VM y verifica que `https` (443) esté permitido pero `telnet` (23) no.
2. Revisa los últimos intentos de acceso con `journalctl` o el log de auth.
3. Escribe las cinco reglas de oro en un archivo `seguridad.txt` en tu home: lo releerás antes de desplegar tu primer servidor. ', 10, '[{"label": "Guía UFW (Ubuntu)", "url": "https://ubuntu.com/server/docs/security-firewall"}]'::jsonb, true, true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;


-- Módulo: Paquetes y software
INSERT INTO "course_modules" (id, course_id, title, description, position, created_at, updated_at) VALUES
('cmod-04-paquetes', 'cur-linux-novatos-000001', 'Paquetes y software', 'Cómo instala software Linux sin descargar instaladores .exe: repositorios, gestores y actualizaciones.', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-17-gestores-de-paquetes', 'cmod-04-paquetes', 'Gestores de paquetes: el app store de la terminal', 'gestores-de-paquetes', NULL, 'ARTICLE', NULL, 'YOUTUBE', 'En Windows instalas programas con instaladores `.exe`; en Linux instalas desde **repositorios** con un gestor de paquetes. Es más seguro (código verificado) y más rápido (una sola línea).

## El modelo de repositorios

Los paquetes viven en **repositorios**: servidores oficiales (o de confianza) que firman cada paquete. Cuando instalas, tu sistema verifica la firma, descarga las dependencias y lo deja todo listo. Por eso `apt` puede instalar un programa de 1 MB y descargar 30 MB de librerías: las dependencias.

## apt (Debian/Ubuntu)

```bash
sudo apt update                 # actualiza la lista de paquetes conocidos
sudo apt search nginx           # busca
sudo apt show nginx             # detalles
sudo apt install nginx          # instala
sudo apt remove nginx           # desinstala (conserva configuración)
sudo apt purge nginx            # desinstala y borra la configuración
sudo apt autoremove             # limpia dependencias huérfanas
```

## Otros gestores

```bash
sudo dnf install git            # Fedora / RHEL
sudo pacman -S git              # Arch
sudo zypper install git         # openSUSE
```

> 💡 **Tip del profesor:** distingue `update` (refresca la lista de paquetes) de `upgrade`/`full-upgrade` (actualiza los instalados). Tutoriales que olvidan el `update` te dan errores de "paquete no encontrado" cuando el paquete realmente existe.

## Flatpak y Snap: aplicaciones empaquetadas

Para apps de escritorio, **Flatpak** y **Snap** empaquetan la aplicación con sus dependencias, sin tocar el sistema:

```bash
flatpak install flathub org.mozilla.firefox
snap install code --classic
```

## Práctica

1. Ejecuta `sudo apt update` y lee cuántos paquetes hay "upgradable".
2. Busca `htop` con `apt search htop` e instálalo.
3. Ejecuta `htop` y sal con `q`.
4. Desinstálalo con `apt remove htop` y comprueba con `which htop` que desapareció. ', 13, '[{"label": "Documentación de apt (Debian)", "url": "https://wiki.debian.org/Apt"}]'::jsonb, true, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-18-instalar-y-buscar-software', 'cmod-04-paquetes', 'Instalar software real: de un buscador a un servidor web', 'instalar-y-buscar-software', NULL, 'ARTICLE', NULL, 'YOUTUBE', 'Vamos a ponerlo en práctica con un caso real: montar un servidor web `nginx` desde cero. Es el algoritmo que repetirás toda tu vida: buscar → instalar → configurar → verificar.

## 1. Buscar

```bash
apt search nginx | head -20
apt show nginx | grep -E "Descripción|Homepage"
```

## 2. Instalar

```bash
sudo apt install nginx
```

## 3. Verificar que el servicio está vivo

```bash
systemctl status nginx        # estado del servicio
curl -I http://localhost      # ¿responde HTTP? → 200 OK
```

Abre `http://localhost` en tu navegador: la página de bienvenida de nginx confirma que Linux acaba de convertirse en un servidor web.

> 💡 **Tip del profesor:** el momento más importante de un deploy no es "instalar", es **verificar**. `curl -I` te dice en una línea si el servicio responde. Acostúmbrate a verificar siempre con curl, `systemctl status` y `journalctl`.

## La regla del "que se reinicie solo"

Los servicios deben sobrevivir a reinicios:

```bash
sudo systemctl enable nginx   # arranca al encender el sistema
sudo systemctl disable nginx  # deshacer
```

## Práctica

1. Instala `nginx` y trae la página de bienvenida.
2. Escribe `sudo systemctl enable nginx` para que sobreviva a reinicios.
3. Rompe y repara: `sudo systemctl stop nginx`, verifica con `curl` (error de conexión), luego `start` y verifica que volvió. Ese ciclo romper→verificar→reparar es la vida real del administrador. ', 11, NULL, true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-19-actualizar-el-sistema', 'cmod-04-paquetes', 'Actualizar el sistema con cabeza', 'actualizar-el-sistema', NULL, 'PRACTICE', NULL, 'YOUTUBE', 'Actualizar es la tarea de mantenimiento más importante. Hazla parte de tu rutina semanal, o el sistema se actualizará solo... en el peor momento.

## El ciclo completo

```bash
sudo apt update                # 1. refresca la lista
sudo apt list --upgradable     # 2. ¿qué hay para actualizar?
sudo apt full-upgrade          # 3. aplica todo
sudo apt autoremove            # 4. limpia lo que ya no se usa
sudo reboot                    # 5. si se actualizó el kernel
```

> ⚠️ **En producción:** no corras `full-upgrade` a lo loco. Primero lee qué se actualiza (`apt list --upgradable`), revisa si toca algún servicio crítico y hazlo en una ventana de mantenimiento. El kernel (`linux-image-*`) requiere reinicio: márcate un aviso.

## ¿Por qué no me obliga a reiniciar?

Linux tarda en aplicar cambios del kernel hasta que reinicias; los servicios viejos siguen corriendo con el kernel anterior. Comprueba si necesitas reinicio:

```bash
[ -f /var/run/reboot-required ] && echo "REINICIO NECESARIO" || echo "sin reinicio"
```

## Actualizaciones de seguridad automáticas

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades  # activar
```

## Práctica

1. En tu VM, ejecuta el ciclo completo y anota cuántos paquetes se actualizaron.
2. Comprueba si se actualizó el kernel (`apt list --upgradable | grep linux-image` antes de actualizar) y reinicia si toca.
3. Activa `unattended-upgrades` para seguridad. Tu VM quedará más fuerte que el 80% de las máquinas de la oficina. ', 10, NULL, true, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-20-repositorios-y-ppa', 'cmod-04-paquetes', 'Repositorios y PPAs: amplía tu catálogo de software', 'repositorios-y-ppa', NULL, 'ARTICLE', NULL, 'YOUTUBE', 'Los repositorios oficiales cubren lo básico, pero el software de vanguardia (Node.js, Docker, IntelliJ) llega por canales extra: PPAs en Ubuntu y repositorios de terceros en Debian.

## Cómo funciona por dentro

Los repositorios se configuran en `/etc/apt/sources.list` y en archivos de `/etc/apt/sources.list.d/`:

```bash
cat /etc/apt/sources.list.d/*.sources 2>/dev/null | head -30
grep -rh "^deb" /etc/apt/ 2>/dev/null | head -10
```

Cada entrada apunta a un servidor y a una "suite" (ej. `noble`, `jammy`). Tras añadir un repositorio nuevo, siempre: `sudo apt update`.

## El PPA (Ubuntu)

```bash
sudo add-apt-repository ppa:deadsnakes/ppa   # Python moderno
sudo apt update
sudo apt install python3.12
```

> ⚠️ **Ojo con los PPAs:** son mantenidos por personas, no por Ubuntu. Usa PPAs "oficiales" (del proyecto o de autores muy conocidos) y elimina los que no uses. Cada repo extra es un nuevo punto de confianza.

## El modelo de "vendor": el caso de Docker

Los proyectos grandes te piden instalar su clave pública y su repo:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc > /dev/null
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu noble stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install docker-ce
```

La **clave firmada** (ese archivo `/etc/apt/sources.list.d/docker.list` con `signed-by`) garantiza que solo se instalen paquetes firmados por Docker. Es el equivalente de Linux a "verificar la firma del instalador".

> 💡 **Tip del profesor:** cuando un proyecto de software te pide "añadir nuestro repositorio", lee primero su documentación oficial. Instalar un repo apuntando a `[trusted=yes]` o sin `signed-by` desactiva la verificación de firmas: eso es un antivirus desactivado.

## Práctica

1. Lista tus repositorios actuales y clasifica: ¿cuántos son oficiales de tu distro y cuántos de terceros?
2. Añade un PPA conocido (ej. `deadsnakes`) y confirma que aparece al hacer `apt update`.
3. Elimínalo después: `sudo add-apt-repository --remove ppa:deadsnakes/ppa && sudo apt update`. Menos superficie, más tranquilidad. ', 8, '[{"label": "Documentación de la comunidad Ubuntu (PPAs)", "url": "https://help.ubuntu.com/community/Repositories/Ubuntu"}]'::jsonb, true, true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;


-- Módulo: Procesos, servicios y red
INSERT INTO "course_modules" (id, course_id, title, description, position, created_at, updated_at) VALUES
('cmod-05-procesos', 'cur-linux-novatos-000001', 'Procesos, servicios y red', 'Lo que hace tu sistema por debajo: procesos, systemd, redes y discos. El día a día de administrar cualquier máquina.', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-21-procesos', 'cmod-05-procesos', 'Procesos: lo que realmente está corriendo', 'procesos', NULL, 'ARTICLE', NULL, 'YOUTUBE', 'Cada programa en ejecución es un **proceso** con un número único (PID). Administrar procesos es medio trabajo del administrador de sistemas.

## Ver procesos

```bash
ps aux                    # todos los procesos, con detalles
ps aux | grep nginx       # ¿nginx está corriendo?
top                       # monitor en vivo (interactivo)
htop                      # la versión bonita y moderna (instálalo)
```

Ejemplo de lectura de `ps aux`: `USER` (quién lo ejecuta), `PID`, `%CPU/%MEM`, `STAT` (estado) y `COMMAND` (el programa). Un proceso con `STAT = Z` es un *zombie* y `D` significa esperando disco (ojo a esa letra cuando todo se traba).

## Señales y kill

Los procesos entienden **señales**. Las tres imprescindibles:

```bash
kill 1234                 # SIGTERM: "por favor, termina" (pedido de cortesía)
kill -9 1234              # SIGKILL: "termina YA" (sin aviso, último recurso)
killall nginx             # manda la señal a todos los procesos de ese nombre
```

> 💡 **Tip del profesor:** usa siempre primero `kill` a secas (SIGTERM): los procesos guardan su estado y cierran limpio. `kill -9` deja al programa sin oportunidad de limpiar archivos temporales o liberar bases de datos. Es el botón de apagado forzado: para emergencias.

## Procesos en segundo plano

```bash
comando &                # lanza en segundo plano y recuperas el prompt
jobs                      # lista tus trabajos en segundo plano
fg                        # trae el último al primer plano
nohup mi_script.sh &     # sobrevive a que cierres la sesión
```

## Práctica

1. Instala `htop` y observa. Identifica: el proceso con más CPU, el PID más bajo (¿qué es? probablemente `systemd`, el PID 1).
2. Lanza `sleep 600 &`, encuéntralo con `ps aux | grep sleep` y mátalo con `kill`.
3. Reto: mata algo tuyo, no del sistema. Jamás `kill -9` del PID 1 a lo loco: esa es la silla que sostiene todo. ', 12, NULL, true, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-22-systemd-y-servicios', 'cmod-05-procesos', 'systemd: el director de orquesta del sistema', 'systemd-y-servicios', NULL, 'ARTICLE', NULL, 'YOUTUBE', '`systemd` es el sistema de inicio y gestión de servicios de casi todas las distros modernas. Es el **PID 1**: el primer proceso, padre de todos.

## El vocabulario

- **Unidad (unit):** una cosa que systemd gestiona: servicio, timer, mount, socket...
- **Servicio:** un daemon que corre en segundo plano (nginx, sshd, postgres).
- **Target:** un estado de arranque (multi-user, graphical, rescue).

## Los comandos que usarás mil veces

```bash
systemctl status nginx          # estado + últimas líneas del log
sudo systemctl start nginx      # arrancar
sudo systemctl stop nginx       # parar
sudo systemctl restart nginx    # reiniciar (para aplicar config)
sudo systemctl reload nginx     # recargar config SIN cortar servicio
sudo systemctl enable nginx     # arrancar automáticamente al boot
sudo systemctl disable nginx    # quitar del arranque automático
systemctl list-units --type=service --state=running   # qué hay corriendo
```

## Los logs: journalctl

```bash
journalctl -u nginx             # log del servicio nginx
journalctl -u nginx --since "1 hour ago"
journalctl -f                   # en vivo, todos los servicios
journalctl -p err -b            # solo errores del arranque actual
```

> 💡 **Tip del profesor:** cuando un servicio "está caído", la secuencia es siempre: `systemctl status` (¿está activo? ¿qué dice el log?), `journalctl -u servicio` (¿por qué falló?), arreglar, `systemctl restart`. Tres comandos, y el 90% de los problemas de servicios se caen.

## Un servicio propio (para el módulo 7)

Un unit file mínimo crea un servicio a tu nombre:

```ini
# /etc/systemd/system/saludos.service
[Unit]
Description=Mi primer servicio
After=network.target

[Service]
ExecStart=/home/kevin/mi_servicio.sh
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload      # systemd relee los unit files
sudo systemctl enable --now saludos
```

## Práctica

1. Instala nginx (del módulo anterior) y arráncalo con `systemctl`.
2. Lee su log con `journalctl -u nginx`.
3. Crea tu propio unit file con un script que haga `echo` a un archivo cada minuto (un `while true; do date >> ~/latido.log; sleep 60; done`) y verifica con `journalctl -u <tu-servicio>`. Ahora ya "tienes un servicio en sistema": es un hito. ', 13, '[{"label": "Documentación oficial de systemd", "url": "https://systemd.io"}]'::jsonb, true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-23-redes-ip-ping-ss-curl', 'cmod-05-procesos', 'Redes: ip, ping, ss y curl', 'redes-ip-ping-ss-curl', NULL, 'ARTICLE', NULL, 'YOUTUBE', 'Sin red no hay servidor. Estos cuatro comandos te dan el 95% de la vida de diagnostico de redes.

## ip — el estado de tus interfaces

```bash
ip address            # IPs de todas las interfaces
ip route              # rutas (la default aparece como "default via ...")
ip link               # interfaces: up/down, MAC
```

Interfaces típicas: `lo` (loopback, 127.0.0.1), `eth0`/`enp3s0` (cable), `wlan0` (Wi-Fi) y `vmbr0` si estás en Proxmox.

## ping — ¿hay alguien vivo?

```bash
ping -c 4 192.168.1.1      # 4 paquetes al gateway
ping -c 4 google.com       # prueba DNS + salida a internet
```

`ping` no confirma que un servicio funcione: solo que la máquina responde. Para servicios, usa `ss`.

## ss — ¿qué puertos están escuchando?

```bash
ss -tlnp                  # TCP escuchando, con programa y PID
ss -tulnp                 # TCP + UDP
ss -tn state established  # conexiones activas
```

> 💡 **Tip del profesor:** cuando digas "no funciona", la primera pregunta que te hará cualquier administrador es: **¿está escuchando?** `sudo ss -tlnp | grep nginx` te responde en segundo. Aprende a querer `ss`.

## curl — probar servicios HTTP

```bash
curl -I https://kevincarmen.xyz     # solo cabeceras
curl -s https://api.github.com/zen  # el cuerpo
curl -s -o /dev/null -w "%{http_code}
" https://kevincarmen.xyz   # solo código
```

## El flujo de diagnóstico

```
¿Está la máquina viva?        → ping
¿Está mi red configurada?     → ip address / ip route
¿Está el puerto escuchando?   → ss -tlnp
¿Responde el servicio?        → curl -I http://localhost
```

## Práctica

1. Dibuja tu camino a internet: `ip route` (gateway), `ping` al gateway, `ping google.com`.
2. Arranca nginx y verifica los cuatro niveles: `systemctl status`, `ss -tlnp | grep 80`, `curl -I localhost`.
3. Innova: para nginx y repite `ss` y `curl`; observa cómo cambia cada nivel del diagnóstico. ', 14, NULL, true, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-24-discos-y-espacio', 'cmod-05-procesos', 'Discos y espacio: df, du y el disco que se llena', 'discos-y-espacio', NULL, 'ARTICLE', NULL, 'YOUTUBE', 'El disco lleno es el segundo motivo más común de "algo raro está pasando" en servidores. Aprende a verlo y a detectar quién come tu espacio.

## df — espacio de los sistemas de archivos

```bash
df -h                  # legible en GB
df -h /var/log         # solo un directorio/montaje
df -hT                 # además, el tipo de filesystem
```

## du — cuánto ocupa cada carpeta

```bash
du -sh /var            # total de una carpeta
du -sh /var/* | sort -h   # todos los hijitos, ordenados
du -h --max-depth=1 /var/log
```

## El disco lleno: síntomas y cura

Un disco al 100% causa síntomas desconcertantes: bases de datos que se niegan a escribir, servicios que mueren, logs que desaparecen.

```bash
df -h                                    # 1. confirma qué disco
sudo du -xh / | sort -h | tail -10       # 2. top 10 carpetas del disco raíz
sudo journalctl --vacuum-size=200M       # 3. recorta logs de systemd
sudo apt autoremove && sudo apt clean     # 4. limpieza de paquetes
```

> 💡 **Tip del profesor:** `du -sh /* | sort -h` sobre la raíz es la pista que casi siempre revela al culpable (típicamente `/var/log`, un backup gigante o `docker`). El 80% de los "se llenó el disco" se resuelve con `journalctl --vacuum-size` + `docker system prune`.

## Práctica

1. `df -h` y anota el uso de `/`.
2. Encuentra tu top 5 de carpetas por tamaño.
3. Crea un archivo de 500 MB con `dd if=/dev/zero of=basura.bin bs=1M count=500`, confírmalo con `df -h` y bórralo. Has visto llenarse un disco y recuperarlo en tu propia máquina. ', 8, NULL, true, true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;


-- Módulo: Texto y automatización
INSERT INTO "course_modules" (id, course_id, title, description, position, created_at, updated_at) VALUES
('cmod-06-texto', 'cur-linux-novatos-000001', 'Texto y automatización', 'grep, tuberías, editores y scripts: la terminal empieza a trabajar por ti. Aquí nace el superpoder de Linux.', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-25-nano-y-vim', 'cmod-06-texto', 'Editores de texto: nano para hoy, vim para siempre', 'nano-y-vim', NULL, 'ARTICLE', NULL, 'YOUTUBE', 'En un servidor sin escritorio, los archivos se editan en la terminal. Aprende primero `nano` (inmediato) y luego las bases de `vim` (el que domina el mundo).

## nano — editar en 5 segundos

```bash
nano notas.txt        # abre (o crea)
# escribe, guarda con Ctrl+O (write out), Enter
# sale con Ctrl+X
```

El menú de abajo te recuerda los atajos: `^G` ayuda, `^O` guardar, `^X` salir, `^W` buscar. No necesitas más para sobrevivir.

## vim — el editor que nunca desaparece

`vim` está en TODOS los servidores del mundo (de hecho `vi` suele ser el único editor que existe en un sistema mínimo). Curva de aprendizaje: invertirás minutos en salir de él la primera vez, y años disfrutándolo.

```bash
vim notas.txt
```

Modos: al arrancar estás en modo **normal**. Pulsa `i` para **insertar** (escribir), `Esc` para volver, y:

```bash
:w       # guardar            :q    # salir
:wq      # guardar y salir    :q!   # salir sin guardar
dd       # borrar línea       yy p  # copiar y pegar línea
/        # buscar             :%s/foo/bar/g   # reemplazar todo
```

> 💡 **Tip del profesor:** `vi` está en la certificación de sistemas y en cualquier sistema mínimo. Cuando llegues a un servidor sin nano, la salida es `Esc :wq`. Aprende `vimtutor` (comando incluido) y dedícale 15 minutos al día durante una semana: la deuda se paga con interés.

## Cerrar el editor cuando te perdiste

¿“atrapado” en vim? `Esc`, luego `:q!`, Enter. ¿Y en nano? `Ctrl+X`. Respira: no se rompe nada.

## Práctica

1. Crea con `nano` un archivo `compromisos.txt` y escribe tus 3 metas del curso.
2. Abre el mismo archivo con `vim` y practica: `i` para escribir, `dd` para borrar, `:wq` para guardar.
3. Corre `vimtutor` y completa las primeras 4 lecciones. Bloquea 15 minutos: vale oro. ', 12, '[{"label": "vimtutor en línea (vimgolf)", "url": "https://www.vim.org/"}]'::jsonb, true, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-26-grep-y-filtros', 'cmod-06-texto', 'grep: encuentra la aguja en el pajar', 'grep-y-filtros', NULL, 'ARTICLE', NULL, 'YOUTUBE', '`grep` busca texto dentro de archivos o de cualquier salida. Es, junto a `ls` y `cd`, el comando que más usan los profesionales.

## Lo básico

```bash
grep "error" server.log              # líneas que contienen "error"
grep -i "error" server.log           # sin distinguir mayúsculas
grep -n "error" server.log           # con número de línea
grep -c "error" server.log           # solo el conteo
grep -v "debug" server.log           # las que NO contienen "debug"
grep -r "TODO" src/                  # recursivo por toda una carpeta
```

## + el historial + la red

```bash
history | grep ssh                   # ¿cuándo usé ssh?
ps aux | grep -i node                # procesos de node
ip a | grep inet                     # solo las IPs
```

> 💡 **Tip del profesor:** la combinación `algún_comando | grep algo` es el gesto más repetido de la terminal. Si un comando produce mucha salida, no la leas: filtra. Tu atención es el recurso más caro.

## Expresiones regulares (píldora)

`grep` entiende regex. Un mínimo infalible:

```bash
grep -E "^[0-9]{3}" log.txt      # líneas que EMPIEZAN con 3 dígitos
grep -E "error|failed" log.txt   # uno u otro
grep -E "nginx[.]log$" archivos   # terminan en nginx.log
```

## El trío de oro: grep + sort + uniq

```bash
cat access.log | awk ''{print $1}'' | sort | uniq -c | sort -rn | head -10
```

Esto da: las 10 IPs que más peticiones hicieron a tu servidor web. Lo entenderás del todo en la próxima clase (tuberías), pero ejecútalo ya y mira la magia.

## Práctica

1. `grep -i error /var/log/syslog | tail -20` y lee qué errores hubo hoy.
2. Cuenta cuántas veces aparece tu nombre de usuario en el historial.
3. Ejecuta el trío de oro contra un log de nginx si instalaste uno (está en `/var/log/nginx/access.log`). ', 10, '[{"label": "Manual de grep (GNU)", "url": "https://www.gnu.org/software/grep/manual/"}]'::jsonb, true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-27-redirecciones-y-tuberias', 'cmod-06-texto', 'Redirecciones y tuberías: la salida de un comando alimenta a otro', 'redirecciones-y-tuberias', NULL, 'PRACTICE', NULL, 'YOUTUBE', 'La filosofía Unix en una frase: **programas pequeños que hacen una cosa bien, conectados entre sí**. La tubería `|` es el pegamento.

## Redirecciones: la salida a un archivo

```bash
ls -l > listado.txt        # guarda la salida en el archivo (sobrescribe)
ls -l >> historial.txt     # añade al final (no sobrescribe)
comando 2> errores.log     # la salida de ERROR al archivo
comando > todo.log 2>&1  # salida normal y errores, juntos
comando < datos.txt        # el archivo como entrada del comando
```

> ⚠️ `>` sobrescribe sin avisar. El clásico accidente: `cat archivo > archivo` → archivo vacío. Hazte el hábito de usar `>>` cuando haya duda.

## Tuberías: conectar comandos

```bash
cat /etc/passwd | head -5
dmesg | grep -i usb
ls -la /var/log | sort -k5 -nr | head -5    # los logs más grandes
ps aux | grep nginx | grep -v grep
```

> 💡 **Tip del profesor:** el `| grep -v grep` es el gesto clásico para quitar el propio `grep` de los resultados de `ps aux | grep`. Mejor aún: `pgrep -a nginx` hace lo mismo sin ensuciar.

## Laboratorio guiado

Construye el comando que responde "¿qué 5 archivos son los más grandes de mi home?" **poco a poco**:

```bash
du -sh ~/   # 1. cuánto ocupa todo
du -ah ~/ | sort -rh | head -5     # 2. top 5
find ~ -type f -printf "%s %p
" | sort -rn | head -5   # 3. versión "pro"
```

## Práctica final

1. Guarda las 20 primeras líneas de `ps aux` en `procesos.txt` con `>` y comprueba con `head`.
2. Concatena: `procesos.txt` + `ls -l` en un archivo con `>>`.
3. Encadena 3 comandos con `|` y describe qué hace cada etapa. Bienvenido a la lógica de tuberías: desde aquí, todo lo que hagas puede automatizarse. ', 8, NULL, true, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-28-tu-primer-script-bash', 'cmod-06-texto', 'Tu primer script en Bash', 'tu-primer-script-bash', NULL, 'VIDEO', 'https://www.youtube.com/watch?v=ABgLEKFhlZE', 'YOUTUBE', 'Un script Bash es una receta: una lista de comandos que se ejecutan en orden. Automatizar una tarea repetitiva es el momento en que la terminal pasa de herramienta a **superpoder**.

## Anatomía de un script

```bash
#!/usr/bin/env bash
# mis_archivos.sh: lista los archivos más recientes de mi home
cd ~/Documentos
ls -lt | head -5
echo "Directorio actual: $(pwd)"
```

- La primera línea (`shebang`) dice qué intérprete usar. Sin ella, el sistema no sabe cómo ejecutar el archivo.
- Las líneas con `#` son comentarios.
- Todo lo demás son comandos normales, en orden.

## Hacerlo ejecutable

```bash
nano mis_archivos.sh      # créalo y escribe el contenido
chmod +x mis_archivos.sh
./mis_archivos.sh         # ejecutar
```

## Un script útil de verdad: resumen del sistema

```bash
#!/usr/bin/env bash
echo "═══ Resumen de $(hostname) ═══"
echo "Uptime: $(uptime -p)"
echo "RAM: $(free -h | awk ''/Mem:/ {print $3" / "$2}'')"
echo "Disco: $(df -h / | awk ''NR==2 {print $3" / "$2" ("$5")"}'')"
echo "IP: $(ip -4 addr show | grep -oP ''(?<=inet )[0-9.]+'' | head -1)"
```

Guárdalo como `resumen.sh`, hazlo ejecutable y correlo. Ese script ya te dice en 5 líneas el estado de cualquier servidor: base de futuras monitorizaciones.

> 💡 **Tip del profesor:** un buen script se escribe para **mañana**: comentar qué hace, no usar rutas absolutas cuando no hace falta y terminar siempre con un `echo` de confirmación. Si un script no dice qué hizo, parece que no hizo nada.

## Práctica

1. Escribe el script `resumen.sh` y hazlo ejecutable.
2. Añádele una línea que salude con tu nombre: `echo "Hola, $USER"`.
3. Agrégale una verificación: si `df -h / | awk ''NR==2 {print $5}''` supera el 80%, que imprima **"⚠️ Disco casi lleno"**. Estás programando tu primera alerta. ', 12, '[{"label": "Guía de Bash (tldp)", "url": "https://tldp.org/LDP/abs/html/"}]'::jsonb, true, true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-29-variables-condiciones-bucles', 'cmod-06-texto', 'Variables, condiciones y bucles: tu script se vuelve inteligente', 'variables-condiciones-bucles', NULL, 'ARTICLE', NULL, 'YOUTUBE', 'Con esto tu script deja de ser una lista de comandos y se vuelve un programa pequeño.

## Variables

```bash
NOMBRE="Kevin"
echo "Hola, $NOMBRE"
echo "Hola, ${NOMBRE}!"        # llaves para delimitar el nombre
mi_ruta=$(pwd)                 # capturar salida de un comando
mi_ruta=`pwd`                  # forma antigua, evítala
```

> ⚠️ En bash no hay espacios alrededor del `=`: `NOMBRE = "Kevin"` es un error clásico de novato.

## Condiciones

```bash
if [ -f "$HOME/notas.txt" ]; then
    echo "Existe notas.txt"
else
    echo "No existe"
fi

if [ "$(df -h / | awk ''NR==2 {print $5}'' | tr -d ''%'')" -gt 80 ]; then
    echo "ALERTA: disco lleno"
fi
```

Test útiles: `-f` (es archivo), `-d` (es directorio), `-z` (vacío), `-eq/-ne/-gt/-lt` (números), `=` (texto).

## Bucles

```bash
for i in 1 2 3 4 5; do
    echo "Vuelta $i"
done

for archivo in *.txt; do
    echo "Procesando $archivo"
done

while read linea; do
    echo ">> $linea"
done < datos.txt

contador=0
while [ $contador -lt 5 ]; do
    echo "Intento $contador"
    contador=$((contador+1))
done
```

## El ejemplo que junta todo: backup

```bash
#!/usr/bin/env bash
# backup.sh: comprime mis Documentos con fecha
set -euo pipefail      # si algo falla, el script se detiene (buena práctica)

FECHA=$(date +%Y-%m-%d)
DESTINO="$HOME/backups/documentos-$FECHA.tar.gz"

mkdir -p "$HOME/backups"
tar -czf "$DESTINO" "$HOME/Documentos"
echo "✅ Backup creado: $DESTINO ($(du -h "$DESTINO" | cut -f1))"
```

> 💡 **Tip del profesor:** `set -euo pipefail` es el cinturón de seguridad de cualquier script serio: `-e` aborta ante errores, `-u` alerta variables sin definir, `-o pipefail` hace que las tuberías también fallen. Míralo como el "modo estricto" de Bash.

## Práctica

1. Escribe `backup.sh` y ejecútalo dos veces: verás que cada backup tiene su fecha.
2. Añade al script una condición: si el backup pesa más de 100 MB, imprimir advertencia.
3. Bucle final: comprime 3 carpetas distintas con el mismo script usando un `for`. Automatización, ¡lograda! ', 14, NULL, true, true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-30-cron-y-tareas-programadas', 'cmod-06-texto', 'cron: el sistema trabaja mientras duermes', 'cron-y-tareas-programadas', NULL, 'ARTICLE', NULL, 'YOUTUBE', '`cron` ejecuta tareas en horario. Backup a las 3 AM, limpieza de logs los domingos, chequeos de salud... Todo eso, sin que nadie lo ejecute.

## El crontab de tu usuario

```bash
crontab -e      # editar mis tareas (con nano, ¿recuerdas?)
crontab -l      # listar
crontab -r      # borrar todas (¡con cuidado!)
```

## El formato de 5 campos

```text
minuto hora día-mes mes día-semana   comando
    *      *      *       *     *    /ruta/a/comando
```

Significado e ideas:

```bash
# backup a las 3:05 de la madrugada, todos los días
5 3 * * * /home/kevin/backup.sh

# cada domingo a medianoche, limpiar logs de systemd
0 0 * * 0 journalctl --vacuum-size=300M

# cada 15 minutos, un chequeo de salud
*/15 * * * * /home/kevin/monitor.sh >> /home/kevin/cron.log 2>&1
```

## Los accesos directos

```text
@reboot        al encender el equipo
@daily         una vez al día   (@daily = 0 0 * * *)
@weekly        una vez a la semana
```

> 💡 **Tip del profesor:** los cron de los servidores medianos envían notificaciones (nube) y guardan su salida en un log. Empezando, haz que cada tarea importante escriba en un log (`>> tarea.log 2>&1`): "cron no ejecutó nada" es el error silencioso más común, y un log lo delata.

## Verificar que cron funciona

```bash
systemctl status cron        # el servicio cron debe estar activo
tail -20 /var/log/syslog | grep -i cron
```

## Práctica

1. Crea una tarea que escriba la fecha en `~/latido.log` cada minuto durante 5 minutos: `* * * * * date >> ~/latido.log`.
2. Verifica con `tail -5 ~/latido.log` que aparecen líneas nuevas cada minuto.
3. Programada tu primera tarea automática: retírala luego con `crontab -e` (borra la línea) para no llenarte el disco de `latidos`. ', 7, NULL, true, true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;


-- Módulo: Siguientes pasos: servidores y el mundo real
INSERT INTO "course_modules" (id, course_id, title, description, position, created_at, updated_at) VALUES
('cmod-07-siguientes-pasos', 'cur-linux-novatos-000001', 'Siguientes pasos: servidores y el mundo real', 'SSH, contenedores y un proyecto final: conviertes lo aprendido en un servidor desplegado de verdad.', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-31-ssh', 'cmod-07-siguientes-pasos', 'SSH: administra servidores desde cualquier lugar', 'ssh', NULL, 'ARTICLE', NULL, 'YOUTUBE', 'SSH (*Secure Shell*) es el protocolo con el que se administran el 99% de los servidores del mundo: una terminal remota **cifrada**. Es el puente entre "uso Linux en mi PC" y "administro Linux en producción".

## Conexión básica

```bash
ssh usuario@192.168.1.50
ssh -p 2222 usuario@servidor.com
ssh usuario@servidor "df -h && free -m"    # un comando remoto, sin sesión
```

## Autenticación con claves (la forma correcta)

```bash
ssh-keygen -t ed25519 -C "mi primer servidor"    # genera el par de claves
ssh-copy-id usuario@192.168.1.50                 # copia tu clave pública al servidor
ssh usuario@192.168.1.50                         # ya no pide contraseña
```

Una **clave privada** (se queda en tu PC, NO se comparte jamás) + una **clave pública** (viaja al servidor). El servidor verifica que tu privada corresponde a la pública y te deja entrar: eso es criptografía asimétrica funcionando.

## Endurecer el servidor

```bash
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no
# PasswordAuthentication no
# Port 2222        (opcional; ya sabes lo que pasa en el 22)
sudo systemctl restart sshd
```

> ⚠️ Antes de desactivar `PasswordAuthentication`, prueba una segunda terminal con tu clave: cerrar la puerta de contraseñas teniendo la llave rota te deja fuera de tu propio servidor. Regla de oro: **nunca te bloquees a ti mismo**.

## Copiar archivos por SSH

```bash
scp archivo.txt usuario@servidor:/home/usuario/
rsync -av --progress carpeta/ usuario@servidor:/backup/
```

## Práctica

1. Desde tu VM, genera tus claves `ed25519` y haz `ssh-copy-id` a la otra VM (o a un LXC de tu homelab).
2. Entra sin contraseña y ejecuta 3 comandos remotos.
3. Desactiva el login por contraseña y por root. Prueba que sigue entrando con tú clave... y desconecta y vuelve a entrar. Ya administras un servidor remoto de verdad. ', 13, '[{"label": "Guía de OpenSSH (Ubuntu)", "url": "https://ubuntu.com/server/docs/service-openssh"}]'::jsonb, true, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-32-docker-y-contenedores', 'cmod-07-siguientes-pasos', 'Contenedores: la forma moderna de desplegar', 'docker-y-contenedores', NULL, 'ARTICLE', NULL, 'YOUTUBE', 'Un **contenedor** empaca una aplicación con TODO lo que necesita (código, runtime, librerías) y la ejecuta aislada del resto del sistema. Es la tecnología que desplegó este mismo sitio web.

## Contenedor vs. máquina virtual

| | VM | Contenedor |
|---|---|---|
| Qué virtualiza | Hardware completo | El sistema operativo |
| Sistema operativo | Uno por VM | Comparten el kernel del host |
| Arranque | Minutos | Segundos |
| Peso | GB | Decenas de MB |
| Aislamiento | Máximo | Bueno (comparte kernel) |

## Los comandos con los que vivirás

```bash
docker pull nginx            # descarga la imagen de nginx
docker run -d -p 8080:80 nginx    # corre un contenedor, mapea puertos
docker ps                    # contenedores corriendo
docker exec -it <id> bash    # terminal DENTRO del contenedor
docker logs <id>             # sus logs
docker stop <id> && docker rm <id>   # para y elimina
```

## docker compose: la receta completa

Con `docker-compose.yml` declaras todo el stack (base de datos + api + web + nginx) y lo levantas con un comando:

```yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: secreto
```

```bash
docker compose up -d
docker compose ps
```

> 💡 **Tip del profesor:** "funciona en mi máquina" deja de existir con Docker: la imagen es la máquina. Si dos personas levantan el mismo `docker-compose.yml`, obtienen entornos idénticos. Por eso Docker cambió el despliegue para siempre.

## El flujo del mundo real

```
Escribes código → lo empacas en una imagen (Dockerfile)
→ lo subes a un registro → el servidor hace docker compose pull && up -d
```

## Práctica

1. Instala Docker Engine con el método oficial (repo Docker, del módulo 4).
2. Corre `docker run -d -p 8080:80 nginx` y abre `http://localhost:8080`.
3. Ejecuta `docker ps` y entra con `docker exec -it <id> bash`; explora el contenedor con los comandos que ya dominas (`ls`, `cat /etc/os-release`...). Nota cómo es un sistema Linux mínimo: todo lo que aprendiste sirve dentro de un contenedor. ', 14, '[{"label": "Documentación de Docker", "url": "https://docs.docker.com"}]'::jsonb, true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "lessons" (id, module_id, title, slug, description, type, video_url, video_type, content, duration, resources, is_free, published, position, created_at, updated_at) VALUES
('clsn-33-proyecto-final', 'cmod-07-siguientes-pasos', 'Proyecto final: despliega tu primer servidor', 'proyecto-final', NULL, 'PRACTICE', NULL, 'YOUTUBE', 'Llegó el momento: montar un servidor de verdad desde cero, con todo lo aprendido. Es el mismo flujo con el que se despliega producción en cualquier empresa.

## El proyecto

Un servidor web (nginx) + una app de prueba + SSH seguro + monitorización básica. Todo en una máquina virtual limpia.

## Checklist

- [x] **1 · Instalar.** Ubuntu Server en una VM limpia (módulo 4).
- [x] **2 · Actualizar.** `sudo apt update && sudo apt full-upgrade` (módulo 19).
- [ ] **3 · Usuario seguro.** Crea un usuario normal, añádelo a `sudo`, desactiva root por SSH (módulos 12 y 31).
- [ ] **4 · Claves SSH.** `ssh-keygen` + `ssh-copy-id` + `PasswordAuthentication no` (módulo 31).
- [ ] **5 · Firewall.** `ufw` permitiendo solo SSH y HTTP (módulo 16).
- [ ] **6 · Servicio.** Instala `nginx` y haz que arranque con `systemctl enable` (módulos 18 y 22).
- [ ] **7 · App.** Crea un servicio propio con systemd: un script que registre "latidos" cada minuto (módulo 22).
- [ ] **8 · Backup.** Cron diario que comprima tus scripts a `/home/usuario/backups/` (módulos 29 y 30).
- [ ] **9 · Monitorización.** Un script que avise si el disco pasa del 80% (módulo 29). Añádelo al cron de cada hora.
- [ ] **10 · Verificación final.** Desde tu PC: `ssh usuario@<IP>` sin contraseña, `curl -I http://<IP>` → 200, `ss -tlnp` mostrando 22 y 80.

## Hitos de aprendizaje

Cada check completado es un módulo interiorizado. Cuando el checklist esté al 100, habrás ejecutado conscientemente: instalación, red, permisos, paquetes, servicios, scripts, cron, firewalls y SSH. Eso es más de lo que sabe un porcentaje alto de personas que dicen "sé Linux".

> 💡 **Tip del profesor:** documenta cada paso mientras lo haces en un `README.md` (con nano). El documento resultante es tu portafolio de "administración de Linux" y el manual de mantenimiento de tu propio servidor.

## Después del curso

Sigue estos caminos según tu interés:

- **Desarrollador:** instala Node/Python y despliega una app con Docker.
- **Sysadmin:** aprende `systemd` a fondo, storage (LVM, filesystems) y networking (VLANs, firewalls).
- **Homelab:** métete en Proxmox y virtualiza todo como este sitio (verás cómo en los blogs de kevincarmen.xyz).

Felicidades: ya no eres novato. Escribe tu primer `ssh servidor` con orgullo. 🐧', 20, '[{"label": "Guía básica de Ubuntu Server", "url": "https://ubuntu.com/server/docs"}]'::jsonb, true, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;


-- Total: 7 módulos, 33 clases, 376 minutos, 6 h 16 min
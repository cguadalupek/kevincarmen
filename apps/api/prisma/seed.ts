import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Taxonomía EDITABLE desde el CMS: categorías principales (tabla `main_categories`)
 * y subcategorías (tabla `subcategories`). Los ids son explícitos y coinciden con
 * la migración `20261008120000_main_categories_editable`, que es la que siembra
 * producción (el seed no se ejecuta en el deploy: el contenedor corre `prisma migrate deploy`).
 */
const MAIN_CATEGORIES = [
  {
    id: 'maincatsoftwaredev000001',
    slug: 'SOFTWARE_DEV',
    name: 'Software & Dev',
    description: 'Desarrollo de software, código, arquitectura y proyectos.',
    position: 1,
  },
  {
    id: 'maincatinfrahomelab000001',
    slug: 'INFRA_HOMELAB',
    name: 'Infra & Homelab',
    description: 'Servidores, contenedores, despliegues, redes y seguridad.',
    position: 2,
  },
  {
    id: 'maincatithardware00000001',
    slug: 'IT_HARDWARE',
    name: 'IT & Hardware',
    description: 'Equipos, ensamblaje, mantenimiento y cableado.',
    position: 3,
  },
  {
    id: 'maincatiatech000000000001',
    slug: 'IA_TECH',
    name: 'IA & Tech',
    description: 'IA local, herramientas de IA y experimentos.',
    position: 4,
  },
] as const;

const SUBCATEGORIES: {
  id: string;
  slug: string;
  name: string;
  description: string;
  mainCategoryId: string;
  position: number;
}[] = [
  {
    id: 'subsoftwaredev00000001',
    slug: 'desarrollo-web-apps',
    name: 'Desarrollo Web & Apps',
    description: 'Frontend, backend, APIs y aplicaciones completas.',
    mainCategoryId: 'maincatsoftwaredev000001',
    position: 1,
  },
  {
    id: 'subsoftwaredev00000002',
    slug: 'proyectos-showcases',
    name: 'Proyectos & Showcases',
    description: 'Casos de estudio y presentación de proyectos.',
    mainCategoryId: 'maincatsoftwaredev000001',
    position: 2,
  },
  {
    id: 'subsoftwaredev00000003',
    slug: 'snippets-guias',
    name: 'Snippets & Guías',
    description: 'Fragmentos de código, recetas y guías cortas.',
    mainCategoryId: 'maincatsoftwaredev000001',
    position: 3,
  },
  {
    id: 'subinfrahomelab00000001',
    slug: 'servidores-homelab',
    name: 'Servidores & Homelab',
    description: 'Proxmox, virtualización, NAS y servicios autohospedados.',
    mainCategoryId: 'maincatinfrahomelab000001',
    position: 1,
  },
  {
    id: 'subinfrahomelab00000002',
    slug: 'docker-despliegues',
    name: 'Docker & Despliegues',
    description: 'Contenedores, Compose, CI/CD y puesta en producción.',
    mainCategoryId: 'maincatinfrahomelab000001',
    position: 2,
  },
  {
    id: 'subinfrahomelab00000003',
    slug: 'redes-seguridad',
    name: 'Redes & Seguridad',
    description: 'Conectividad, ruteo, firewall, VPN y hardening.',
    mainCategoryId: 'maincatinfrahomelab000001',
    position: 3,
  },
  {
    id: 'subithardware000000001',
    slug: 'hardware-ensamblaje',
    name: 'Hardware & Ensamblaje',
    description: 'Equipos, componentes, builds y rendimiento.',
    mainCategoryId: 'maincatithardware00000001',
    position: 1,
  },
  {
    id: 'subithardware000000002',
    slug: 'soporte-mantenimiento',
    name: 'Soporte & Mantenimiento',
    description: 'Diagnóstico, reparación y mantenimiento de equipos.',
    mainCategoryId: 'maincatithardware00000001',
    position: 2,
  },
  {
    id: 'subithardware000000003',
    slug: 'cableado-redes-fisicas',
    name: 'Cableado & Redes Físicas',
    description: 'Cableado estructurado, racks y montaje físico.',
    mainCategoryId: 'maincatithardware00000001',
    position: 3,
  },
  {
    id: 'subiatech00000000000001',
    slug: 'ia-local-selfhosted',
    name: 'IA Local & Self-Hosted',
    description: 'Modelos ejecutados en tu propio hardware.',
    mainCategoryId: 'maincatiatech000000000001',
    position: 1,
  },
  {
    id: 'subiatech00000000000002',
    slug: 'ai-tooling-workflow',
    name: 'AI Tooling & Workflow',
    description: 'Herramientas de IA y cómo integrarlas en el flujo diario.',
    mainCategoryId: 'maincatiatech000000000001',
    position: 2,
  },
  {
    id: 'subiatech00000000000003',
    slug: 'experimentos-fisica-tech',
    name: 'Experimentos & Física/Tech',
    description: 'Pruebas, experimentos y exploraciones técnicas.',
    mainCategoryId: 'maincatiatech000000000001',
    position: 3,
  },
];

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrador del CMS',
      permissions: {
        create: [
          { action: 'manage', resource: 'posts' },
          { action: 'manage', resource: 'pages' },
          { action: 'manage', resource: 'media' },
          { action: 'manage', resource: 'categories' },
        ],
      },
    },
  });

  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'Admin123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@kevincarmen.xyz' },
    update: {},
    create: {
      email: 'admin@kevincarmen.xyz',
      passwordHash,
      name: 'Kevin Carmen',
      roleId: adminRole.id,
    },
  });

  const adminUser = await prisma.user.findUniqueOrThrow({
    where: { email: 'admin@kevincarmen.xyz' },
  });

  // Categorías principales: upsert por slug (volver a correr el seed no duplica).
  for (const main of MAIN_CATEGORIES) {
    await prisma.mainCategory.upsert({
      where: { slug: main.slug },
      update: { name: main.name, description: main.description, position: main.position },
      create: main,
    });
  }

  // Subcategorías: upsert por clave compuesta (mainCategoryId, slug).
  for (const sub of SUBCATEGORIES) {
    await prisma.subcategory.upsert({
      where: {
        mainCategoryId_slug: { mainCategoryId: sub.mainCategoryId, slug: sub.slug },
      },
      update: { name: sub.name, description: sub.description, position: sub.position },
      create: sub,
    });
  }

  /** Id de una subcategoría por (categoría principal, slug). */
  const subId = async (mainCategoryId: string, slug: string) =>
    (
      await prisma.subcategory.findUniqueOrThrow({
        where: { mainCategoryId_slug: { mainCategoryId, slug } },
      })
    ).id;

  const woMicDate = new Date(Date.UTC(2026, 7, 15, 14, 0, 0));
  const proxmoxDate = new Date(Date.UTC(2026, 7, 10, 11, 0, 0));
  const networkingDate = new Date(Date.UTC(2026, 7, 5, 12, 0, 0));

  const woMic = await prisma.post.upsert({
    where: { slug: 'usa-el-microfono-de-tu-celular-para-la-pc-womic' },
    update: {},
    create: {
      title: 'Usa el micrófono de tu celular para la PC | WO MIC',
      slug: 'usa-el-microfono-de-tu-celular-para-la-pc-womic',
      excerpt:
        'Aprende a convertir tu teléfono en un micrófono inalámbrico para tu PC con WO Mic, una alternativa gratuita y multiplataforma.',
      content:
        '# Usa el micrófono de tu celular para la PC | WO MIC\n\nTutorial paso a paso para reutilizar tu smartphone como micrófono USB inalámbrico en Linux, macOS y Windows.\n\n## Instalación\n\n1. Descarga WO Mic en PC y celular.\n2. Conéctalos a la misma red.\n3. Inicia el servidor en la PC.\n4. Conecta desde la app móvil.',
      coverImage: '/uploads/posts/c47dd70c-0bb9-4bb4-90ec-416bd6dc429c.png',
      videoUrl: 'https://www.youtube.com/watch?v=jbSY5f1Jeu8',
      videoType: 'YOUTUBE',
      status: 'PUBLISHED',
      publishedAt: woMicDate,
      readingTime: 4,
      authorId: adminUser.id,
      mainCategoryId: 'maincatithardware00000001',
      subCategoryId: await subId('maincatithardware00000001', 'soporte-mantenimiento'),
    },
  });

  const short = await prisma.post.upsert({
    where: { slug: 'short-configura-vlans-con-tu-celular' },
    update: {},
    create: {
      title: 'Configura VLANs desde tu celular',
      slug: 'short-configura-vlans-con-tu-celular',
      excerpt:
        'Un Short con tres opciones de configuración rápida para segmentar tu red con un smartphone.',
      content:
        '# Short VLANs desde el celular\n\nDemostración de cómo etiquetar puertos usando la app oficial de tu switch.',
      coverImage: '/uploads/posts/faf6fb22-ed0f-4bf5-9e4c-47affcee3468.png',
      videoUrl: 'https://www.youtube.com/shorts/5NKJrP_WaFk',
      videoType: 'YOUTUBE_SHORT',
      status: 'PUBLISHED',
      publishedAt: new Date(woMicDate.getTime() + 86400000),
      readingTime: 1,
      authorId: adminUser.id,
      mainCategoryId: 'maincatinfrahomelab000001',
      subCategoryId: await subId('maincatinfrahomelab000001', 'redes-seguridad'),
    },
  });

  await prisma.post.upsert({
    where: { slug: 'como-instalar-proxmox-ve-desde-cero' },
    update: {},
    create: {
      title: 'Cómo instalar Proxmox VE desde cero: guía completa para tu primer servidor',
      slug: 'como-instalar-proxmox-ve-desde-cero',
      excerpt:
        'Guía detallada para instalar Proxmox VE desde cero, configurar la red, preparar almacenamiento, crear VMs y contenedores LXC y proteger tu primer nodo.',
      content:
        '# Cómo instalar Proxmox VE desde cero\n\nProxmox VE es una plataforma de virtualización de código abierto basada en Debian. Permite administrar máquinas virtuales con KVM y contenedores LXC desde una interfaz web, además de ofrecer almacenamiento, redes virtuales, copias de seguridad y clústeres.\n\n## Antes de empezar\n\nLa instalación de Proxmox normalmente borra el disco elegido. No la ejecutes sobre un equipo que contenga datos importantes sin tener una copia de seguridad verificada.\n\n### Requisitos recomendados\n\n- Procesador de 64 bits con soporte de virtualización Intel VT-x o AMD-V.\n- 8 GB de RAM como mínimo para un laboratorio pequeño. 16 GB o más resulta mucho más cómodo.\n- Un SSD para el sistema y, si es posible, discos separados para máquinas virtuales y copias de seguridad.\n- Conexión de red por cable durante la instalación.\n- Una memoria USB de 4 GB o más.\n- Un equipo adicional para descargar la ISO y acceder posteriormente a la interfaz web.\n\nAntes de instalar, confirma en el firmware UEFI/BIOS que la virtualización está habilitada. Las opciones suelen llamarse `Intel Virtualization Technology`, `VT-x`, `SVM` o `AMD-V`. Si vas a pasar dispositivos PCIe a una máquina virtual, activa también IOMMU.\n\n## 1. Descargar la imagen de instalación\n\nDescarga la ISO desde la página oficial de Proxmox VE. Evita imágenes modificadas o enlaces de terceros.\n\nDespués de descargarla, verifica su suma SHA-256. En Linux puedes usar:\n\n```bash\nsha256sum proxmox-ve_*.iso\n```\n\nEn Windows PowerShell:\n\n```powershell\nGet-FileHash .\\proxmox-ve_*.iso -Algorithm SHA256\n```\n\nCompara el resultado con la suma publicada por Proxmox. Esta comprobación evita instalar una imagen incompleta o alterada.\n\n## 2. Crear el USB arrancable\n\nPuedes utilizar Rufus, balenaEtcher o una herramienta equivalente. Selecciona la ISO de Proxmox y la memoria USB correcta antes de iniciar el proceso, ya que el programa borrará su contenido.\n\nConecta el USB al servidor y abre el menú de arranque. En muchos equipos se accede con `F8`, `F11`, `F12` o `Esc`. Selecciona la memoria USB en modo UEFI si el firmware ofrece ambas opciones.\n\n## 3. Instalar Proxmox VE\n\nEn el instalador:\n\n1. Selecciona **Install Proxmox VE (Graphical)**.\n2. Acepta el acuerdo de licencia.\n3. Elige el disco de destino.\n4. Abre **Options** si necesitas cambiar el sistema de archivos, el tamaño de `swap` o el tamaño de `hdsize`.\n5. Selecciona el país, la zona horaria y la distribución del teclado.\n6. Define una contraseña fuerte para `root` y un correo de administración.\n7. Configura el nombre completo del equipo.\n8. Asigna una dirección IP estática, la puerta de enlace y los servidores DNS.\n9. Revisa el resumen y confirma la instalación.\n\nEl nombre completo debe resolver correctamente dentro de tu red. Por ejemplo, si el nodo se llama `pve1.lab.local`, el DNS o el archivo `hosts` deberían poder resolver ese nombre desde los equipos que lo administren. No uses una IP como hostname.\n\nAl terminar, retira el USB y reinicia el servidor.\n\n## 4. Acceder a la interfaz web\n\nDesde otro equipo abre:\n\n```text\nhttps://IP_DEL_NODO:8006\n```\n\nEl certificado inicial suele ser autofirmado, por lo que el navegador mostrará una advertencia. Es normal en una instalación nueva. Inicia sesión con:\n\n- Usuario: `root`\n- Realm: `Linux PAM standard authentication`\n- Contraseña: la definida durante la instalación\n\nNo expongas directamente el puerto 8006 a Internet. Para acceso remoto utiliza una VPN, una red privada o un túnel protegido con autenticación adicional.\n\n## 5. Actualizar el sistema y configurar los repositorios\n\nAntes de crear cargas de trabajo, actualiza el nodo:\n\n```bash\napt update\napt full-upgrade\n```\n\nSi tienes una suscripción empresarial, configura el repositorio enterprise correspondiente. En un laboratorio sin suscripción, utiliza el repositorio no-subscription siguiendo la documentación oficial de la versión instalada. No mezcles repositorios de distintas versiones de Debian o Proxmox.\n\nDespués de cambiar repositorios, vuelve a ejecutar:\n\n```bash\napt update\napt full-upgrade\n```\n\nReinicia si se actualizó el kernel:\n\n```bash\nreboot\n```\n\n## 6. Entender la red de Proxmox\n\nLa instalación suele crear un bridge llamado `vmbr0`. El bridge funciona como un switch virtual: las máquinas virtuales y contenedores conectados a él pueden aparecer en la misma red que el nodo físico.\n\nUna configuración típica tiene:\n\n- Una interfaz física, por ejemplo `enp3s0`.\n- `vmbr0` como bridge principal.\n- La dirección IP del nodo asignada al bridge, no directamente a la interfaz física.\n- La puerta de enlace configurada en el bridge.\n\nComprueba la configuración con:\n\n```bash\nip address\nip route\ncat /etc/network/interfaces\n```\n\nNo cambies la red remota sin una consola alternativa disponible. Un error en la puerta de enlace, la máscara o el nombre de la interfaz puede dejar el nodo inaccesible.\n\n## 7. Preparar almacenamiento\n\nEn **Datacenter > Storage** verás los almacenes disponibles. Cada uno define qué contenido puede guardar: imágenes ISO, plantillas LXC, discos de máquinas virtuales, contenedores y copias de seguridad.\n\nUna distribución sencilla para un laboratorio es:\n\n- `local`: ISOs, plantillas y snippets.\n- `local-lvm` o un pool ZFS: discos de máquinas virtuales y contenedores.\n- Un almacenamiento independiente: copias de seguridad.\n\nNo confundas RAID con copias de seguridad. RAID puede mejorar disponibilidad o tolerancia ante fallos, pero no protege frente a borrados, corrupción, ransomware o errores de configuración.\n\n## 8. Crear una primera máquina virtual\n\nPara crear una VM desde la interfaz:\n\n1. Pulsa **Create VM**.\n2. Define un nombre identificable.\n3. Selecciona una ISO en la pestaña **OS**.\n4. Usa un controlador de disco `VirtIO SCSI` cuando el sistema invitado lo soporte.\n5. Asigna CPU y memoria de acuerdo con la carga real.\n6. Conecta la tarjeta de red al bridge `vmbr0` y utiliza `VirtIO`.\n7. Revisa el resumen y crea la VM.\n\nComo punto de partida, una VM Linux ligera puede comenzar con 2 vCPU, 2 a 4 GB de RAM y un disco de 20 a 32 GB. Ajusta estos valores después de observar el consumo, en lugar de reservar todos los recursos desde el inicio.\n\n## 9. Crear un contenedor LXC\n\nLos contenedores LXC comparten el kernel del nodo y suelen consumir menos recursos que una VM. Son apropiados para servicios Linux que no necesitan un kernel independiente.\n\nPasos básicos:\n\n1. Descarga una plantilla desde **local > CT Templates**.\n2. Pulsa **Create CT**.\n3. Define un hostname y una contraseña inicial.\n4. Selecciona la plantilla y el almacenamiento raíz.\n5. Asigna disco, CPU y memoria.\n6. Configura la red con `vmbr0`.\n7. Elige DHCP o una IP estática reservada.\n8. Inicia el contenedor y entra mediante la consola o SSH.\n\nDespués de entrar al contenedor:\n\n```bash\napt update\napt full-upgrade\n```\n\nPara servicios de producción, limita privilegios, evita contenedores privilegiados salvo que sean imprescindibles y documenta cualquier capability adicional.\n\n## 10. Primeras medidas de seguridad\n\n- Utiliza contraseñas únicas y largas.\n- Crea usuarios administrativos individuales cuando sea posible.\n- Usa claves SSH para la administración remota.\n- Deshabilita el acceso SSH por contraseña después de validar las claves.\n- Limita el acceso a los puertos de administración mediante firewall o VPN.\n- Activa el firewall de Proxmox con reglas explícitas y pruébalas desde una consola alternativa.\n- Mantén Proxmox y los invitados actualizados.\n- No reutilices la contraseña de `root` en servicios o bases de datos.\n- No publiques la interfaz web de Proxmox directamente en Internet.\n\nEl firewall debe configurarse por capas: Datacenter, nodo y, cuando corresponda, máquina virtual o contenedor. Empieza con reglas restrictivas y abre únicamente los puertos necesarios.\n\n## 11. Copias de seguridad y recuperación\n\nConfigura una tarea de backup desde **Datacenter > Backup**. Define:\n\n- Qué VMs y contenedores incluir.\n- Frecuencia y ventana de ejecución.\n- Retención de copias.\n- Almacenamiento de destino.\n- Compresión y modo de snapshot cuando sea compatible.\n\nUna copia no está verificada hasta que puedes restaurarla. Realiza una restauración de prueba periódica en una VM o nodo separado. Si el almacenamiento de backups está dentro del mismo disco físico, todavía tienes un único punto de fallo.\n\n## 12. Problemas frecuentes\n\n### No puedo acceder a `:8006`\n\nComprueba que el nodo tiene la IP esperada y que existe una ruta por defecto:\n\n```bash\nip address\nip route\nsystemctl status pveproxy\n```\n\nRevisa también el firewall y que estés usando `https`, no `http`.\n\n### La VM no tiene Internet\n\nComprueba que la interfaz está conectada a `vmbr0`, que tiene una IP válida, que la puerta de enlace es correcta y que el DNS funciona. Desde el invitado prueba primero la puerta de enlace y después una IP externa.\n\n### El nodo perdió conectividad después de editar la red\n\nUsa la consola local o la consola del hipervisor. Revisa `/etc/network/interfaces`, el nombre real de la interfaz con `ip link` y la configuración del bridge. No dependas de una sesión SSH abierta para recuperar una red mal configurada.\n\n### Falta espacio\n\nRevisa el almacenamiento desde la interfaz o con:\n\n```bash\ndf -h\npvesm status\n```\n\nElimina ISOs antiguas, snapshots innecesarios y backups que ya estén protegidos en otro almacenamiento. Nunca borres discos o volúmenes sin confirmar a qué VM o contenedor pertenecen.\n\n## Conclusión\n\nUna instalación sólida de Proxmox no termina cuando aparece la interfaz web. La parte importante es dejar una red estable, separar almacenamiento y backups, limitar el acceso administrativo, actualizar el sistema y probar la recuperación. Con esa base puedes añadir VMs, contenedores, Docker, servicios de laboratorio y, más adelante, nodos adicionales o almacenamiento compartido.\n\nAntes de poner una carga importante en producción, documenta la IP del nodo, los bridges, los almacenes, las credenciales de recuperación y el procedimiento para restaurar una VM o contenedor.\n',
      coverImage: '/uploads/posts/6722b5a2-2c36-4ad6-aad1-1190dc1055a2.png',
      status: 'PUBLISHED',
      publishedAt: proxmoxDate,
      readingTime: 9,
      authorId: adminUser.id,
      mainCategoryId: 'maincatinfrahomelab000001',
      subCategoryId: await subId('maincatinfrahomelab000001', 'servidores-homelab'),
    },
  });

  const networking = await prisma.post.upsert({
    where: { slug: 'redes-basicas-para-homelabs' },
    update: {},
    create: {
      title: 'Redes básicas para homelabs',
      slug: 'redes-basicas-para-homelabs',
      excerpt: 'VLANs, firewall y segmentación para mantener un homelab seguro y ordenado.',
      content:
        '# Redes básicas para homelabs\n\nConceptos fundamentales de direccionamiento, VLANs y firewall para homelabs modernos.\n\n## VLANs\n\nDivide tráfico creando VLANs separadas para management, servidores y clientes.\n\n## Firewall\n\nBloquea por defecto y abre por excepción. Documenta cada regla.\n\n## VLAN trunk\n\nUsa 802.1Q para llevar varias VLANs por un solo cable.',
      status: 'PUBLISHED',
      publishedAt: networkingDate,
      readingTime: 5,
      authorId: adminUser.id,
      mainCategoryId: 'maincatinfrahomelab000001',
      subCategoryId: await subId('maincatinfrahomelab000001', 'redes-seguridad'),
    },
  });

  console.log('Seed completado');
  console.log({ woMic: woMic.slug, short: short.slug, networking: networking.slug });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

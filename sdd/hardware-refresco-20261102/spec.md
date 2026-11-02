---
tipo: especificacion
estado: en_curso
fecha_creacion: 2026-11-02
agente: cdx-hardware-prod-01a19884
---

# Hardware: muestra publicada al entrar o a petición

MAD autoriza el 02/11 integrar y publicar la mejora del dashboard. El portal es estático: cada entrada y el botón superior «Actualizar muestra publicada» descargan la última publicación disponible; no miden el hardware privado. Se muestra fecha real de medición, estado parcial/antiguo y error de lectura. Ningún intervalo, recarga por foco/visibilidad ni reintento perpetuo. Abortar al salir y evitar duplicados durante carga.

Conservar frontera numérica de hardware, identificadores fijos Mac/DGX, privacidad, capacidad y benchmark histórico, idiomas ES/EN, portada y enlaces. Mejorar jerarquía con barras CPU/GPU/RAM/disco y ocupado/disponible, swap y funciones generales públicas. No procesos, PID, modelos residentes, nombres de volúmenes ni datos internos. Si total-disponible incluye reserva del sistema, describirlo como espacio no disponible y no como datos ocupados.

Base 0bb6ec1. Sin nuevas dependencias ni automatizaciones. Productor y publicación existentes se conservan; el visitante solo recarga datos publicados. La modificación del hook de datos es opcional y por defecto no cambia a otros consumidores. Inicio automático y clic superior se prueban junto a espera y visibilidad sin peticiones nuevas, carga/error/timeout, abortado al salir, privacidad numérica y vista ES/EN a 390/1440. Gate completo existente antes de Pages; verificar resultado servido y contenido actual. Sin jueces.

Tareas: UI y ciclo de refresco; contratos focales; gate del proyecto; commit limitado a rutas propias; publicación con workflow existente; contraste del sitio vivo. Reversión mediante revert de commits propios y workflow, preservando datos de otras tareas.

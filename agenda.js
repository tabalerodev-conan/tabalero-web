(() => {
  const config = window.TABALEROS_SUPABASE_CONFIG;
  const list = document.querySelector("#show-list");
  const source = document.querySelector("#agenda-source");
  const message = document.querySelector("#agenda-message");

  if (
    !config ||
    !config.url ||
    !config.anonKey ||
    config.url.includes("TU-PROYECTO") ||
    config.anonKey.includes("TU_CLAVE")
  ) {
    return;
  }

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    source.textContent = "Agenda no disponible";
    message.textContent = "No se pudo cargar el cliente de Supabase. Revisá tu conexión e intentá nuevamente.";
    return;
  }

  const client = window.supabase.createClient(config.url, config.anonKey);
  const dateFormatter = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  function makeTextElement(tagName, className, value) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = value;
    return element;
  }

  function makeShowCard(show) {
    const article = document.createElement("article");
    article.className = "grid gap-4 py-6 sm:grid-cols-[1fr_1.2fr_1.4fr_auto] sm:items-center";

    const date = new Date(`${show.event_date}T12:00:00Z`);
    const dateLabel = Number.isNaN(date.getTime())
      ? show.event_date
      : dateFormatter.format(date);
    article.append(makeTextElement("p", "display-type text-xl font-bold uppercase text-gold", dateLabel));

    const location = document.createElement("div");
    location.append(makeTextElement("p", "font-bold", show.city));
    location.append(makeTextElement("p", "mt-1 text-sm text-white/50", "Argentina"));
    article.append(location);
    article.append(makeTextElement("p", "text-sm text-white/70", show.venue));

    if (show.sold_out) {
      const soldOut = makeTextElement(
        "span",
        "inline-flex w-fit cursor-not-allowed items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-xs font-bold text-white/45",
        "Sold out ×",
      );
      soldOut.setAttribute("aria-label", "Entradas agotadas");
      article.append(soldOut);
    } else if (show.ticket_url) {
      if (URL.canParse(show.ticket_url) && new URL(show.ticket_url).protocol === "https:") {
        const ticketUrl = new URL(show.ticket_url);
        const ticketLink = makeTextElement(
          "a",
          "inline-flex w-fit items-center gap-2 rounded-full bg-coral px-5 py-2.5 text-xs font-bold transition hover:bg-rose-400",
          "Comprar entradas ↗",
        );
        ticketLink.href = ticketUrl.href;
        ticketLink.target = "_blank";
        ticketLink.rel = "noopener noreferrer";
        article.append(ticketLink);
      } else {
        console.error("La agenda contiene una URL de entradas inválida:", show.id);
        article.append(makeTextElement("span", "text-xs text-rose-300", "Enlace de entradas no válido"));
      }
    } else {
      article.append(makeTextElement("span", "text-xs text-white/50", "Entradas próximamente"));
    }

    return article;
  }

  async function loadShows() {
    source.textContent = "Agenda oficial";
    message.textContent = "Cargando fechas…";
    list.replaceChildren();

    const today = new Date();
    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const { data, error } = await client
      .from("shows")
      .select("id, event_date, city, venue, ticket_url, sold_out")
      .gte("event_date", todayString)
      .order("event_date", { ascending: true });

    if (error) {
      source.textContent = "Error al cargar la agenda";
      message.textContent = "No se pudieron cargar las fechas. Revisá la configuración de Supabase.";
      console.error("No se pudo cargar la agenda:", error.message);
      return;
    }

    if (!data.length) {
      message.textContent = "Todavía no hay fechas publicadas.";
      return;
    }

    const fragment = document.createDocumentFragment();
    data.forEach((show) => fragment.append(makeShowCard(show)));
    list.append(fragment);
    message.textContent = "";
  }

  loadShows().catch((error) => {
    source.textContent = "Error al cargar la agenda";
    message.textContent = "Ocurrió un error inesperado al cargar las fechas.";
    console.error("Error inesperado al cargar la agenda:", error);
  });
})();

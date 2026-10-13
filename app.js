const stato = {
  squadre: [],
  partite: [],
  classifica: [],
  selezionata: null,
  giornata: 1,
  filtro: ""
};

const corpoClassifica = document.getElementById("corpo-classifica");
const campoRicerca = document.getElementById("ricerca");
const selettoreGiornata = document.getElementById("giornata");
const elencoPartite = document.getElementById("partite");
const dettaglio = document.getElementById("dettaglio");
const messaggioVuoto = document.getElementById("vuoto");
const messaggioErrore = document.getElementById("errore");
const sottotitolo = document.getElementById("sottotitolo");

function nomeSquadra(id) {
  const squadra = stato.squadre.find((s) => s.id === id);
  return squadra ? squadra.nome : "";
}

function giocata(partita) {
  return partita.golCasa !== null && partita.golTrasferta !== null;
}

function calcolaClassifica() {
  const righe = new Map();

  stato.squadre.forEach((s) => {
    righe.set(s.id, {
      id: s.id,
      nome: s.nome,
      pt: 0,
      g: 0,
      v: 0,
      n: 0,
      p: 0,
      gf: 0,
      gs: 0
    });
  });

  stato.partite.filter(giocata).forEach((m) => {
    const casa = righe.get(m.casa);
    const ospite = righe.get(m.trasferta);

    casa.g += 1;
    ospite.g += 1;
    casa.gf += m.golCasa;
    casa.gs += m.golTrasferta;
    ospite.gf += m.golTrasferta;
    ospite.gs += m.golCasa;

    if (m.golCasa > m.golTrasferta) {
      casa.v += 1;
      casa.pt += 3;
      ospite.p += 1;
    } else if (m.golCasa < m.golTrasferta) {
      ospite.v += 1;
      ospite.pt += 3;
      casa.p += 1;
    } else {
      casa.n += 1;
      ospite.n += 1;
      casa.pt += 1;
      ospite.pt += 1;
    }
  });

  return Array.from(righe.values())
    .map((r) => ({ ...r, dr: r.gf - r.gs }))
    .sort(
      (a, b) =>
        b.pt - a.pt ||
        b.dr - a.dr ||
        b.gf - a.gf ||
        a.nome.localeCompare(b.nome, "it")
    );
}

function zonaPosizione(posizione, totale) {
  if (posizione <= 2) return "zona-promozione";
  if (posizione <= 4) return "zona-playoff";
  if (posizione > totale - 2) return "zona-retrocessione";
  return "";
}

function formattaDr(valore) {
  return valore > 0 ? "+" + valore : String(valore);
}

function disegnaClassifica() {
  const totale = stato.classifica.length;
  const termine = stato.filtro.trim().toLowerCase();

  const righe = stato.classifica
    .map((r, indice) => ({ ...r, posizione: indice + 1 }))
    .filter((r) => r.nome.toLowerCase().includes(termine));

  corpoClassifica.innerHTML = righe
    .map((r) => {
      const classi = [zonaPosizione(r.posizione, totale)];
      if (r.id === stato.selezionata) classi.push("attiva");

      return `
        <tr class="${classi.filter(Boolean).join(" ")}">
          <td class="pos">${r.posizione}</td>
          <td class="squadra">
            <button type="button" class="nome-squadra" data-id="${r.id}" aria-pressed="${r.id === stato.selezionata}">${r.nome}</button>
          </td>
          <td class="pt">${r.pt}</td>
          <td>${r.g}</td>
          <td>${r.v}</td>
          <td>${r.n}</td>
          <td>${r.p}</td>
          <td>${formattaDr(r.dr)}</td>
        </tr>`;
    })
    .join("");

  messaggioVuoto.hidden = righe.length > 0;
}

function esitoPerSquadra(partita, id) {
  const inCasa = partita.casa === id;
  const fatti = inCasa ? partita.golCasa : partita.golTrasferta;
  const subiti = inCasa ? partita.golTrasferta : partita.golCasa;
  if (fatti > subiti) return "v";
  if (fatti < subiti) return "p";
  return "n";
}

function righePartita(partita) {
  const esito = giocata(partita)
    ? `<span class="esito">${partita.golCasa} - ${partita.golTrasferta}</span>`
    : `<span class="esito da-giocare">da giocare</span>`;

  return `
    <li class="partita">
      <span class="casa">${nomeSquadra(partita.casa)}</span>
      ${esito}
      <span class="trasferta">${nomeSquadra(partita.trasferta)}</span>
    </li>`;
}

function disegnaDettaglio() {
  if (stato.selezionata === null) {
    dettaglio.innerHTML =
      '<p class="messaggio">Seleziona una squadra dalla classifica per vedere la forma e le partite.</p>';
    return;
  }

  const riga = stato.classifica.find((r) => r.id === stato.selezionata);
  const posizione = stato.classifica.indexOf(riga) + 1;

  const sue = stato.partite
    .filter((p) => p.casa === riga.id || p.trasferta === riga.id)
    .sort((a, b) => a.giornata - b.giornata);

  const forma = sue
    .filter(giocata)
    .slice(-5)
    .map((p) => esitoPerSquadra(p, riga.id));

  const pallini = forma
    .map((e) => `<li class="${e}">${e.toUpperCase()}</li>`)
    .join("");

  dettaglio.innerHTML = `
    <h3 class="titolo-squadra">${riga.nome}</h3>
    <p class="riepilogo">${posizione}ª posizione, ${riga.pt} punti in ${riga.g} partite. Reti ${riga.gf} fatte, ${riga.gs} subite.</p>
    <ul class="forma" aria-label="Ultime partite">${pallini}</ul>
    <ul class="partite">${sue.map(righePartita).join("")}</ul>`;
}

function disegnaGiornata() {
  const partite = stato.partite.filter((p) => p.giornata === stato.giornata);
  elencoPartite.innerHTML = partite.map(righePartita).join("");
}

function preparaSelettore() {
  const giornate = Array.from(new Set(stato.partite.map((p) => p.giornata))).sort(
    (a, b) => a - b
  );

  selettoreGiornata.innerHTML = giornate
    .map((g) => `<option value="${g}">Giornata ${g}</option>`)
    .join("");

  const ultimaGiocata = stato.partite.filter(giocata).map((p) => p.giornata);
  stato.giornata = ultimaGiocata.length
    ? Math.max(...ultimaGiocata)
    : giornate[0];

  selettoreGiornata.value = String(stato.giornata);
}

function collegaEventi() {
  campoRicerca.addEventListener("input", (evento) => {
    stato.filtro = evento.target.value;
    disegnaClassifica();
  });

  corpoClassifica.addEventListener("click", (evento) => {
    const bottone = evento.target.closest("button[data-id]");
    if (!bottone) return;

    const id = Number(bottone.dataset.id);
    stato.selezionata = stato.selezionata === id ? null : id;
    disegnaClassifica();
    disegnaDettaglio();
  });

  selettoreGiornata.addEventListener("change", (evento) => {
    stato.giornata = Number(evento.target.value);
    disegnaGiornata();
  });
}

async function avvia() {
  try {
    const risposta = await fetch("dati.json");
    if (!risposta.ok) throw new Error("Risposta non valida");

    const dati = await risposta.json();
    stato.squadre = dati.squadre;
    stato.partite = dati.partite;
    stato.classifica = calcolaClassifica();

    sottotitolo.textContent = `${dati.campionato} · ${dati.stagione}`;

    preparaSelettore();
    collegaEventi();
    disegnaClassifica();
    disegnaDettaglio();
    disegnaGiornata();
  } catch (errore) {
    messaggioErrore.hidden = false;
  }
}

avvia();
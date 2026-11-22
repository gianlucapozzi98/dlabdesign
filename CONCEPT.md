# CONCEPT — D-Labdesign

Scritto il 22/11/2026. Base: `DIREZIONE-ARTISTICA-D-LABDESIGN.md` (fatti, FISSO, SPUNTO) + analisi del riferimento con un browser automatico + lettura del sito attuale del cliente.

---

## 1. Belgrade Arbor — cosa fa davvero (analisi del 22/11/2026)

Aperto https://belgradearbor.rs/en con un browser automatico a 1440×900 e a 375×812. Ho letto DOM, rete e variabili globali e fatto screenshot a più altezze di scroll.

**Tecnologia osservata**
- Next.js (bundle Turbopack, `__next_f`), **GSAP**, **Lenis 1.3.23** (classe `lenis` su `<html>`), **Three.js** (`__THREE__`).
- Due canvas: uno **WebGL2** (immagini e video su piani con distorsione) e uno **2D fisso a tutto schermo** con `pointer-events: none` (probabile effetto cursore o transizioni: non ho potuto confermarlo).
- Molti video MP4/WebM in `object-fit: cover` dentro maschere, che partono solo quando entrano in vista.
- Tracciamento già attivo al caricamento: Google Tag Manager, Google Ads, pixel Meta, HubSpot. **Da non imitare**: da noi nessuno script parte prima del consenso.

**Caricamento**
- Schermo color crema con logo, una **linea sottile che si riempie** e una percentuale grande ("0%" → "100%").
- Su mobile il caricatore è rimasto fermo a **0% per più di 6 secondi**: blocca il contenuto. **Da non imitare**: da noi la prima foto è subito nel markup e il caricatore si salta.

**Hero ("dal disegno al reale")**
- Pagina ferma finché non si scorre. Al primo scroll parte un **video** (`hero-m.webm`, 15,6 s) che va per conto suo, non legato alla posizione dello scroll (ho verificato: 2 s reali = 2 s di video). Il video comincia con uno **schizzo a matita della facciata** (linee verticali, poi la facciata disegnata) e si trasforma nel **render** del palazzo. È la stessa idea del nostro seme, "dal disegno allo spazio", ma fatta con un render.
- Sopra al video la barra di navigazione è una **pillola scura centrata** (MENU · logo · INQUIRE) e c'è un badge "Site of the Day" di Awwwards sul bordo destro.

**Intro "Belgrade Arbor Design" (≈ 8100 px, sezione fissa)**
- Una frase alla volta, **parola per parola**, che passa da sfocata a nitida; le frasi vecchie si sfocano e scompaiono.
- Le foto entrano in **cornici irregolari** (WebGL) che si deformano con lo scroll.
- In basso a sinistra c'è una **barra di avanzamento con il numero del capitolo**; un pulsante "Explore in 3D" ripete l'accesso al 3D.
- Chiusura con un titolo enorme ("A new chapter in prestigious living") le cui lettere entrano sfocate.

**Sezioni successive**
- *Location*: titolo gigante in trasparenza sopra un video, poi "What's around" con una **mappa in assonometria a linee** e luoghi cliccabili (l'elenco cambia l'evidenziazione).
- *Residences / Business*: blocco titolo con video, poi una schermata con **schede-tipologia a sinistra** e immagini a destra.
- *Roots*: sfondo navy, titolo gigante dietro a una foto in cornice smussata e un collage di immagini.
- *View from above*: **sezione orizzontale fissa** (pin di ≈ 4460 px) che scorre sopra una vista aerea, con nuvole in primo piano ed etichette A/B sui corpi di fabbrica.
- *Installment plan*: 5 fasi in percentuale (non pertinente per noi).
- *Footer*: newsletter con consenso, menu, disclaimer, un render grande del palazzo e il nome gigante in basso.

**"3D Experience" (`/en/3d`)**
- È un **modello 3D in tempo reale** (Three.js) che scarica file `.glb` separati per edificio, natura, persone, auto, ferrovia, appartamenti e negozi.
- Interfaccia: caricatore con percentuale, **minimappa "Navigation"** in alto a destra con circa 16 punti di vista ("Select view angle"), barra in basso con **Properties**, **Filters** e uno **slider dell'ora del giorno** (10:00 am) che muove il sole.
- **Non ho potuto usarlo:** nel browser automatico la pagina va in crash ("This page couldn't load") subito dopo il 100%, in due tentativi. Non ho visto quindi né la navigazione tra i punti di vista né il pannello delle proprietà né le transizioni della camera.

**Cosa non ho potuto vedere o misurare**
- Codice degli shader, curve e durate esatte delle animazioni, transizioni tra pagine.
- Comportamento con `prefers-reduced-motion` e con la tastiera.
- La versione mobile oltre al caricatore: sotto 768 px il sito usa sezioni separate (`IntroductionMobile`, `RootsMobile`) e **niente WebGL**, ma il caricatore non è arrivato al 100% nel tempo di prova.
- L'esperienza 3D, per il crash.

**Cosa ne prendiamo (meccanica, non contenuti)**

| Belgrade Arbor | D-Labdesign |
|---|---|
| Caricatore con linea + percentuale | Una **linea di disegno** che si traccia con la percentuale vera della prima foto; **< 1,2 s, saltabile**, mai bloccante |
| Hero "schizzo → render" | Hero "**rilievo → foto vera**": le linee sono estratte dalla foto reale e sono **in registro** con essa |
| Intro fissa con capitoli e barra | Tour fisso con **cartiglio** (il riquadro dei disegni tecnici) che fa da indicatore: TAV. 01–04 |
| Parola per parola da sfocato a nitido | Testo del Lab che si "inchiostra" riga per riga (un solo effetto, sobrio) |
| Mappa a linee con luoghi | Schema a linee **dichiarato "schema, non in scala"** di Alcentro e del parcheggio di Via Setti |
| Striscia orizzontale fissa | Striscia dei **progetti realizzati** con foto vere |
| "3D Experience" | "Esplora lo studio": tour senza movimento + video reale dell'inaugurazione; 360° solo quando il cliente fornirà i panorami |
| Footer con illustrazione e nome gigante | Footer con **disegno a linea** e dati societari |

Non prendiamo: piano di pagamento, testi, immagini, video, codice, marchio, palette, badge.

---

## 2. Cosa ho trovato sul sito attuale del cliente (d-labdesign.it, 22/11/2026)

Foto **vere** dello studio e dei lavori, pubblicate dal cliente stesso (catalogo completo in `IMMAGINI.md`):
- **The Opening**: 24 foto dell'inaugurazione (credito sul sito: "Foto Melting Studio, Treviglio"), 1000×667 px. Tra queste: il **cortile esterno** al tramonto, la **facciata vetrata con l'ingresso**, la **soglia** con la scritta sulla parete, l'**interno**. **È esattamente la sequenza esterno → porta → interno**, con foto reali dello studio.
- **CASA | 01**: 6 foto (prima, durante, **una pianta disegnata a mano e colorata**, dopo), fino a 3284 px.
- **NEGOZIO | ABBIGLIAMENTO** (7 foto) e **NEGOZIO | TABACCHERIA** (9 foto, compresa una "prima"): due progetti realizzati **non citati nella direzione artistica** ma pubblicati dal cliente → li inserisco con i soli testi del sito e li segnalo da confermare.
- Video dell'inaugurazione su YouTube (`s1OqLSYq2kc`).
- Logo solo raster 160×80 → **ridisegnato in vettoriale come segnaposto**, da sostituire col file ufficiale.

> Le 4 foto inviate da Gianluca (Google Foto) restano le foto **definitive** del tour: le metto in `src/assets/tour/tour-01…04.jpg` e il resto si rigenera da solo (vedi `README.md`). Finché non arrivano, il tour usa **4 foto vere dell'inaugurazione del 2012**, con l'etichetta "Foto provvisorie" e i limiti dichiarati: risoluzione bassa, persone riconoscibili (servono le liberatorie), lo studio può essere cambiato.

---

## 3. Tre concept per l'apertura e per il sistema di disegni

### Concept A — **"Lucido"** (rilievo in registro sulla foto vera)
Un foglio di carta da lucido è appoggiato su una fotografia vera dello studio. Sul lucido una matita **ricalca la foto**: le linee sono **estratte dalla foto stessa in fase di build** (rilevamento dei bordi + trasformata di Hough → segmenti), quindi coincidono con gli spigoli reali, i serramenti, la porta. Il disegno si traccia, il lucido si solleva (parallasse: le linee stanno su un piano diverso dalla foto) e resta il luogo vero.
Con lo scroll la camera **avanza verso la porta**; il **contorno della porta** (disegnato in rosso quota) diventa una **finestra** da cui si vede la foto successiva, che si allarga fino a riempire lo schermo: si **attraversa la soglia** senza tagli. Poi soglia → interno, dove compaiono **hotspot** con etichetta.
Il **cartiglio** (il riquadro dei disegni tecnici) in basso a destra indica tavola, titolo e avanzamento. In tutto il sito i disegni seguono le stesse regole: linee sottili color grafite, una sola linea rossa per le quote, **mai numeri che sembrino misure**.
- **Impatto 9/10**: "dal disegno allo spazio" diventa letterale, in un modo che un architetto riconosce (lucido, ricalco, cartiglio, soglia).
- **Realismo 10/10**: la foto non viene deformata; le linee derivano dalla foto; nessun 3D.
- **Fattibilità 8/10**: SVG + GSAP + maschere CSS; lo script di ricalco gira in build con `sharp`, che è già nello stack.
- **Peso 9/10**: 4 immagini AVIF progressive (la prima eager), 4 SVG piccoli, niente WebGL.

### Concept B — **"Sezione A–A'"** (il taglio)
Non si cammina: si **taglia**. Una linea di sezione orizzontale (con le frecce A e A') scende sullo schermo con lo scroll: sopra la linea resta il disegno, sotto la linea compare la foto vera. Ogni passaggio di scroll sposta il taglio più dentro: esterno, soglia, interno. Il taglio è anche la navigazione delle sezioni (A–A', B–B'…).
- **Impatto 7/10**: molto grafico e riconoscibile, ma dà meno la sensazione di "entrare".
- **Realismo 10/10**.
- **Fattibilità 9/10**: `clip-path` + SVG.
- **Peso 10/10**.

### Concept C — **"Plastico"** (diorama a strati con profondità)
Ogni foto è divisa in 3–5 piani (primo piano, telaio della porta, fondo) con **mappe di profondità** stimate in build da un modello (es. Depth Anything con ONNX) e uno shader WebGL leggero (OGL) che sposta i pixel secondo la profondità mentre la camera avanza: effetto "foto 3D" molto spettacolare.
- **Impatto 10/10** al primo sguardo.
- **Realismo 5/10**: lo spostamento dei pixel **deforma** bordi, mobili e prodotti (strappi e stiramenti ai margini della profondità). È al limite del FISSO 2: "non deve cambiare l'aspetto reale dei luoghi e dei prodotti".
- **Fattibilità 5/10**: modello di circa 100 MB in build, foto a 1000 px troppo piccole per mappe pulite, e i difetti vanno corretti a mano per ogni foto.
- **Peso 5/10**: WebGL, texture di profondità, fallback separato.

### Scelta: **A — "Lucido"**, con un solo elemento preso da B
- A è l'unico concept con impatto alto e **zero rischi** sui FISSO: foto non alterate, linee derivate dalla realtà, niente 3D finto.
- Da B prendo la **linea di sezione** come elemento grafico ricorrente: separatore di sezione, linea del caricatore, linea di chiusura nel footer.
- La profondità (principio 4) arriva da una **parallasse a strati** (foto, lucido, linee, etichette e cartiglio a velocità diverse) e dal **passaggio attraverso la porta**, in pausa fuori schermo e con fallback statico.

**Perché supera lo SPUNTO**: lo SPUNTO chiedeva "disegno tecnico dell'ingresso che si traccia, poi la foto lo riempie". Qui il disegno non è un'illustrazione generica: è il **rilievo della foto vera**, in registro, rigenerato da solo quando arrivano le foto definitive (`npm run tour:trace`). La porta del disegno **è** il passaggio verso la stanza successiva.

---

## 4. Sistema dei disegni tecnici (regole)

1. **Tre famiglie**, sempre dichiarate:
   - **Rilievo**: linee estratte dalle foto vere (tour). Dicitura: "Rilievo dalla foto".
   - **Disegno di progetto reale**: solo file del cliente (es. la pianta a mano di CASA | 01, che è una foto del disegno vero).
   - **Schema**: SVG decorativo o concettuale. Dicitura "Schema illustrativo" o "Schema, non in scala".
2. Tratti: 0,75 px grafite (secondario), 1,25 px inchiostro (principale), 1 px **rosso quota** per le sole linee di quota. Nessun altro colore nel disegno.
3. Quote: linea, frecce o tick architettonici a 45°, testo in IBM Plex Mono. **Nessun numero** se la misura non è reale: si usano i nomi ("ingresso", "Via Setti", "piano").
4. Animazione: `stroke-dashoffset` guidato dallo scroll (GSAP ScrollTrigger, `scrub`), prima le linee principali, poi le secondarie, per ultime le quote. Con *reduced motion* il disegno è già completo.
5. Il cartiglio (TAV., titolo, scala "—", data) è il "timbro" del sito: header delle tavole, indicatore del tour, footer.

## 5. Un solo "wow" per sezione

| Sezione | Wow | Il resto |
|---|---|---|
| Caricamento | linea che si traccia + % reale | — |
| Tour | il lucido si solleva, poi si attraversa la porta | cartiglio, hotspot |
| Il Lab | il testo si inchiostra riga per riga | statico |
| Volumi e materiali | esploso assonometrico | etichette che compaiono |
| Progetti | striscia orizzontale con cornici che si disegnano | hover sobrio |
| The Opening | provino a contatto (contact sheet) con segni di taglio | lightbox |
| Vieni a trovarci | schema di Alcentro che si traccia | mappa solo su consenso |
| Footer | linea di sezione A–A' | — |

## 6. Rischi e limiti dichiarati
- Le foto del tour provvisorio sono del **2012** e a **1000 px**: vanno sostituite. Il ricalco automatico produce un rilievo "da cantiere", non un CAD: per le foto definitive si può rifinire a mano l'SVG generato.
- Le foto con persone (inaugurazione) richiedono le **liberatorie**, oppure vanno sostituite.
- Il 360° (SPUNTO 4.1 B) e il video di cammino (4.1 C) dipendono da materiale che oggi non c'è: la pagina "Esplora lo studio" non viene pubblicata finché il materiale non arriva.

export type Lang = 'HU' | 'EN' | 'DE';

type TranslationValue = Record<Lang, string>;

export const t: Record<string, TranslationValue> = {
  app_name: { HU: "EU AutoValue Intelligence", EN: "EU AutoValue Intelligence", DE: "EU AutoValue Intelligence" },
  tagline: { HU: "Tudd meg pontosabban, mennyit ér az autód.", EN: "Know more precisely what your car is worth.", DE: "Erfahren Sie genauer, was Ihr Auto wert ist." },
  subtitle: { HU: "AI-alapú piaci értékbecslés, Price Confidence és kereskedői árszint elemzés.", EN: "AI-powered market valuation, Price Confidence and dealer price level analysis.", DE: "KI-gestützte Marktbewertung, Price Confidence und Händlerpreisanalyse." },
  start_valuation: { HU: "Ingyenes értékbecslés →", EN: "Free Valuation →", DE: "Kostenlose Bewertung →" },
  no_registration: { HU: "Nincs regisztráció szükséges az első becsléshez", EN: "No registration required for your first estimate", DE: "Keine Registrierung für die erste Schätzung erforderlich" },

  // Pillars
  pillar1_title: { HU: "Piaci árak", EN: "Market Prices", DE: "Marktpreise" },
  pillar1_desc: { HU: "27 EU ország valós adatai alapján", EN: "Based on real data from 27 EU countries", DE: "Basierend auf Daten aus 27 EU-Ländern" },
  pillar2_title: { HU: "Tárgyalási terv", EN: "Negotiation Plan", DE: "Verhandlungsplan" },
  pillar2_desc: { HU: "Nyitóajánlat, target, walk-away HUF értékekkel", EN: "Opening offer, target, walk-away with exact values", DE: "Eröffnungsangebot, Ziel, Walk-away mit genauen Werten" },
  pillar3_title: { HU: "Hirdetési szöveg", EN: "Listing Text", DE: "Anzeigentext" },
  pillar3_desc: { HU: "Kész hirdetés, copy-paste 1 kattintással", EN: "Ready listing, copy-paste with 1 click", DE: "Fertige Anzeige, Copy-Paste mit 1 Klick" },

  // How it works
  how_title: { HU: "Hogyan működik?", EN: "How does it work?", DE: "Wie funktioniert es?" },
  how_step1: { HU: "Járműadatok megadása", EN: "Enter vehicle data", DE: "Fahrzeugdaten eingeben" },
  how_step2: { HU: "AI elemzés", EN: "AI analysis", DE: "KI-Analyse" },
  how_step3: { HU: "Értékjelentés", EN: "Value report", DE: "Wertbericht" },

  // Wizard
  step1_title: { HU: "Járműadatok", EN: "Vehicle Data", DE: "Fahrzeugdaten" },
  step2_title: { HU: "Piaci elemzés", EN: "Market Analysis", DE: "Marktanalyse" },
  step3_title: { HU: "Értékbecslési eredmények", EN: "Valuation Results", DE: "Bewertungsergebnisse" },

  // Form labels
  make: { HU: "Gyártó", EN: "Make", DE: "Hersteller" },
  model: { HU: "Modell", EN: "Model", DE: "Modell" },
  year: { HU: "Évjárat", EN: "Year", DE: "Baujahr" },
  mileage: { HU: "Futásteljesítmény (km)", EN: "Mileage (km)", DE: "Kilometerstand" },
  color: { HU: "Szín", EN: "Color", DE: "Farbe" },
  fuel_type: { HU: "Üzemanyag", EN: "Fuel Type", DE: "Kraftstoffart" },
  service_book: { HU: "Szervizkönyv", EN: "Service Book", DE: "Serviceheft" },
  owners: { HU: "Tulajdonosok száma", EN: "Number of Owners", DE: "Anzahl Besitzer" },
  accident_free: { HU: "Balesetmentes", EN: "Accident Free", DE: "Unfallfrei" },
  target_market: { HU: "Célpiac", EN: "Target Market", DE: "Zielmarkt" },

  // Value band
  value_band: { HU: "Piaci értéksáv", EN: "Market Value Range", DE: "Marktwertbereich" },
  recommended_ask: { HU: "Ajánlott hirdetési ár", EN: "Recommended Listing Price", DE: "Empfohlener Angebotspreis" },
  negotiation_floor: { HU: "Tárgyalási minimum", EN: "Negotiation Floor", DE: "Verhandlungsminimum" },

  // Tabs
  buyer_tab: { HU: "Vásárlóként", EN: "As a Buyer", DE: "Als Käufer" },
  seller_tab: { HU: "Eladóként", EN: "As a Dealer", DE: "Als Händler" },

  // Metrics
  condition_score: { HU: "Állapotpontszám", EN: "Condition Score", DE: "Zustandspunktzahl" },
  sales_velocity: { HU: "Becsült értékesítési idő (nap)", EN: "Est. days to sell", DE: "Geschätzte Verkaufszeit (Tage)" },
  confidence: { HU: "Megbízhatóság", EN: "Confidence", DE: "Zuverlässigkeit" },

  // Buttons
  copy_listing: { HU: "Hirdetési szöveg másolása", EN: "Copy listing text", DE: "Anzeigetext kopieren" },
  new_valuation: { HU: "Új értékbecslés", EN: "New Valuation", DE: "Neue Bewertung" },
  download_pdf: { HU: "PDF letöltése", EN: "Download PDF", DE: "PDF herunterladen" },
  past_valuations: { HU: "Korábbi becslések", EN: "Past Valuations", DE: "Frühere Bewertungen" },

  // Link
  link_audit: { HU: "Összekapcsolás kár-elemzéssel (opcionális)", EN: "Link damage analysis (optional)", DE: "Schadensanalyse verknüpfen (optional)" },
  no_audit_linked: { HU: "Manuális becslés (nincs csatolt kár-elemzés)", EN: "Manual valuation (no damage analysis linked)", DE: "Manuelle Bewertung (keine Schadensanalyse)" },

  // Agents
  agent_market: { HU: "Piaci árak gyűjtése...", EN: "Collecting market prices...", DE: "Marktpreise werden gesammelt..." },
  agent_condition: { HU: "Állapot-korrekció számítása...", EN: "Calculating condition adjustment...", DE: "Zustandskorrektur wird berechnet..." },
  agent_regional: { HU: "Regionális kereslet értékelése...", EN: "Assessing regional demand...", DE: "Regionale Nachfrage wird bewertet..." },
  agent_velocity: { HU: "Értékesítési sebesség becslése...", EN: "Predicting sales velocity...", DE: "Verkaufsgeschwindigkeit wird geschätzt..." },
  agent_negotiation: { HU: "Tárgyalási stratégia felépítése...", EN: "Building negotiation strategy...", DE: "Verhandlungsstrategie wird erstellt..." },
  agent_bayesian: { HU: "Bayesian értékeloszlás számítása...", EN: "Running Bayesian distribution...", DE: "Bayesianische Verteilung wird berechnet..." },
  agent_dealer: { HU: "Kereskedői riport generálása...", EN: "Generating dealer report...", DE: "Händlerbericht wird erstellt..." },

  // Analysis
  analysis_running: { HU: "Elemzés folyamatban...", EN: "Analysis in progress...", DE: "Analyse läuft..." },
  estimated_time: { HU: "Becsült hátralévő idő", EN: "Estimated time remaining", DE: "Geschätzte verbleibende Zeit" },
  seconds: { HU: "másodperc", EN: "seconds", DE: "Sekunden" },

  // Results
  dealer_summary: { HU: "Kereskedői összefoglaló", EN: "Dealer Summary", DE: "Händlerzusammenfassung" },
  negotiation_strategy: { HU: "Tárgyalási stratégia", EN: "Negotiation Strategy", DE: "Verhandlungsstrategie" },
  market_position: { HU: "Piaci pozíció", EN: "Market Position", DE: "Marktposition" },
  listing_text: { HU: "Hirdetési szöveg (másolásra kész)", EN: "Listing Text (ready to copy)", DE: "Anzeigentext (kopierbereit)" },
  risk_warnings: { HU: "Kockázati figyelmeztetések", EN: "Risk Warnings", DE: "Risikowarnungen" },
  opening_offer: { HU: "Nyitóajánlat", EN: "Opening Offer", DE: "Eröffnungsangebot" },
  target_price: { HU: "Célár", EN: "Target Price", DE: "Zielpreis" },
  walk_away: { HU: "Kivonulási határ", EN: "Walk-away", DE: "Walk-away" },
  optimal_ask: { HU: "Optimális hirdetési ár", EN: "Optimal Listing Price", DE: "Optimaler Angebotspreis" },
  worth_doing: { HU: "Érdemes elvégezni", EN: "Worth doing", DE: "Lohnt sich" },
  skip_repairs: { HU: "Ne végezd el", EN: "Skip these", DE: "Überspringen" },
  arguments: { HU: "Érvek a tárgyaláshoz", EN: "Negotiation arguments", DE: "Verhandlungsargumente" },
  red_flags: { HU: "Figyelmeztetők", EN: "Red Flags", DE: "Warnhinweise" },
  quick_actions: { HU: "Teendők", EN: "Actions", DE: "Aktionen" },
  immediate: { HU: "Azonnali", EN: "Immediate", DE: "Sofort" },
  within_week: { HU: "1 héten belül", EN: "Within a week", DE: "Innerhalb einer Woche" },
  optional: { HU: "Opcionális", EN: "Optional", DE: "Optional" },

  // Portal
  portal_title: { HU: "Korábbi becslések", EN: "Past Valuations", DE: "Frühere Bewertungen" },
  all: { HU: "Összes", EN: "All", DE: "Alle" },
  completed: { HU: "Befejezett", EN: "Completed", DE: "Abgeschlossen" },
  in_progress: { HU: "Folyamatban", EN: "In Progress", DE: "In Bearbeitung" },
  open: { HU: "Megnyitás", EN: "Open", DE: "Öffnen" },
  no_valuations: { HU: "Még nincs értékbecslésed.", EN: "No valuations yet.", DE: "Noch keine Bewertungen." },

  // Audit link banner
  audit_banner: { HU: "Van kár-elemzésed az EV Audit Suite-ból? Kapcsold össze a pontos kozmetikai állapot-adatokkal.", EN: "Have a damage analysis from EV Audit Suite? Link it for precise condition data.", DE: "Haben Sie eine Schadensanalyse aus dem EV Audit Suite? Verknüpfen Sie sie für genaue Zustandsdaten." },
  link_now: { HU: "Összekapcsolás →", EN: "Link now →", DE: "Jetzt verknüpfen →" },

  // Velocity
  days_at_recommended: { HU: "Ajánlott áron", EN: "At recommended", DE: "Zum empfohlenen Preis" },
  days_at_aggressive: { HU: "Agresszív áron", EN: "At aggressive price", DE: "Zum aggressiven Preis" },
  price_trend: { HU: "Árirányzat", EN: "Price trend", DE: "Preistrend" },
  market_depth: { HU: "Piaci mélység", EN: "Market depth", DE: "Markttiefe" },

  // Nav
  nav_home: { HU: "Főoldal", EN: "Home", DE: "Startseite" },
  nav_valuation: { HU: "Értékbecslés", EN: "Valuation", DE: "Bewertung" },
  nav_portal: { HU: "Becsléseim", EN: "My Valuations", DE: "Meine Bewertungen" },

  // Misc
  copied: { HU: "Másolva!", EN: "Copied!", DE: "Kopiert!" },
  yes: { HU: "Igen", EN: "Yes", DE: "Ja" },
  no: { HU: "Nem", EN: "No", DE: "Nein" },
  powered_by: { HU: "Powered by EV DIAG", EN: "Powered by EV DIAG", DE: "Powered by EV DIAG" },

  // Result page - EV DIAG Intelligence
  ev_diag_market_value: { HU: "EV DIAG Piaci Érték", EN: "EV DIAG Market Value", DE: "EV DIAG Marktwert" },
  confidence_score: { HU: "Megbízhatósági pontszám", EN: "Confidence Score", DE: "Zuverlässigkeitswert" },
  price_range: { HU: "Árkategória", EN: "Price Range", DE: "Preisbereich" },
  low_price: { HU: "Alacsony ár", EN: "Low Price", DE: "Niedriger Preis" },
  market_price: { HU: "Piaci ár", EN: "Market Price", DE: "Marktpreis" },
  high_price: { HU: "Magas ár", EN: "High Price", DE: "Hoher Preis" },
  negotiation_intelligence: { HU: "Tárgyalási Intelligencia", EN: "Negotiation Intelligence", DE: "Verhandlungsintelligenz" },
  recommended_offer: { HU: "Ajánlott ajánlat", EN: "Recommended Offer", DE: "Empfohlenes Angebot" },
  negotiation_margin: { HU: "Tárgyalási mozgástér", EN: "Negotiation Margin", DE: "Verhandlungsspielraum" },
  dealer_typical_price: { HU: "Kereskedői tipikus ár", EN: "Dealer Typical Price", DE: "Typischer Händlerpreis" },
  market_liquidity: { HU: "Piaci Likviditás", EN: "Market Liquidity", DE: "Marktliquidität" },
  liquidity_level: { HU: "Likviditási szint", EN: "Liquidity Level", DE: "Liquiditätsniveau" },
  est_selling_time: { HU: "Becsült eladási idő", EN: "Est. Selling Time", DE: "Geschätzte Verkaufszeit" },
  expected_resale: { HU: "Várható viszonteladási érték (3 év)", EN: "Expected Resale Value (3 years)", DE: "Erwarteter Wiederverkaufswert (3 Jahre)" },
  photo_upgrade_title: { HU: "Pontosítsd az értékbecslést fotók feltöltésével.", EN: "Improve accuracy by uploading photos.", DE: "Verbessern Sie die Genauigkeit durch Hochladen von Fotos." },
  photo_front: { HU: "Elöl", EN: "Front", DE: "Vorne" },
  photo_rear: { HU: "Hátul", EN: "Rear", DE: "Hinten" },
  photo_side: { HU: "Oldal", EN: "Side", DE: "Seite" },
  photo_interior: { HU: "Belső", EN: "Interior", DE: "Innenraum" },
  photo_damage: { HU: "Sérülés", EN: "Damage", DE: "Schäden" },
  send_to_seller: { HU: "Küldd el az eladónak", EN: "Send to Seller", DE: "An Verkäufer senden" },
  dealer_cta_title: { HU: "Kereskedő vagy?", EN: "Are you a dealer?", DE: "Sind Sie Händler?" },
  dealer_cta_desc: { HU: "Próbáld ki az EV DIAG Dealer Platform bétát 50 ingyenes audit kredittel.", EN: "Try the EV DIAG Dealer Platform beta with 50 free audit credits.", DE: "Testen Sie die EV DIAG Dealer Platform Beta mit 50 kostenlosen Audit-Credits." },
  engine: { HU: "Motor", EN: "Engine", DE: "Motor" },
  transmission: { HU: "Váltó", EN: "Transmission", DE: "Getriebe" },
  equipment: { HU: "Felszereltség", EN: "Equipment", DE: "Ausstattung" },
  optional_fields: { HU: "Opcionális mezők", EN: "Optional Fields", DE: "Optionale Felder" },
  share_report: { HU: "Jelentés megosztása", EN: "Share Report", DE: "Bericht teilen" },
  report_copied: { HU: "Jelentés vágólapra másolva!", EN: "Report copied to clipboard!", DE: "Bericht in die Zwischenablage kopiert!" },
  days: { HU: "nap", EN: "days", DE: "Tage" },

  // Auth
  sign_in: { HU: "Bejelentkezés", EN: "Sign In", DE: "Anmelden" },
  sign_up: { HU: "Regisztráció", EN: "Sign Up", DE: "Registrieren" },
  sign_out: { HU: "Kijelentkezés", EN: "Sign Out", DE: "Abmelden" },
  email: { HU: "E-mail", EN: "Email", DE: "E-Mail" },
  password: { HU: "Jelszó", EN: "Password", DE: "Passwort" },
  full_name: { HU: "Teljes név", EN: "Full Name", DE: "Vollständiger Name" },
  forgot_pw: { HU: "Elfelejtett jelszó?", EN: "Forgot password?", DE: "Passwort vergessen?" },
  confirm_email: { HU: "Erősítsd meg az e-mail címed.", EN: "Please confirm your email address.", DE: "Bitte bestätige deine E-Mail-Adresse." },
  settings: { HU: "Beállítások", EN: "Settings", DE: "Einstellungen" },
  profile: { HU: "Profil", EN: "Profile", DE: "Profil" },
  save: { HU: "Mentés", EN: "Save", DE: "Speichern" },
  language_setting: { HU: "Nyelvi beállítás", EN: "Language Setting", DE: "Spracheinstellung" },
  saved_success: { HU: "Sikeresen mentve!", EN: "Saved successfully!", DE: "Erfolgreich gespeichert!" },
  reset_pw_sent: { HU: "Jelszó-visszaállító e-mail elküldve.", EN: "Password reset email sent.", DE: "E-Mail zum Zurücksetzen des Passworts gesendet." },
  login_required: { HU: "Bejelentkezés szükséges", EN: "Login required", DE: "Anmeldung erforderlich" },
  nav_account: { HU: "Fiókom", EN: "My Account", DE: "Mein Konto" },
};

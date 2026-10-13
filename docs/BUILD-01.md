# Pierwsza kampania budowy

13.10.2026 · implementacja zatwierdzona przez Ownera · specyfikacja: FOUNDATION.md

**Cel:** uruchomić jedną rozległą krainę z zamieszkanym miejscem, rzeczywistą materialnością, lokalnym autorstwem i trwałą ciągłością. Pierwszy działający przyrost ma być dostępny do oglądu przed pełną dojrzałością systemów.

**Architektura:** TypeScript, Three.js i Box3D 0.1.1; geograficzne metry, jeden stały krok i zakończony stan. Źródło miejsca, historia instancji, prywatna pamięć oraz reprezentacje fizyki pozostają rozdzielone. Jedna prowadząca integracja, niezależne zakresy z przypisanymi plikami.

## Wykonanie

- [ ] Stan i historia (`src/world/types.ts`, `state.ts`, `checkpoint.ts`, `revisions.ts`): trwałe ID, zmiana tylko wskazanego zakresu, odrzucenie zajętej geometrii, zapis/odczyt bez resetowania ludzi i rzeczy. Test przed implementacją: odłożona rzecz i lokalna pamięć przetrwają odczyt; odrzucona poprawka nie mutuje stanu.
- [ ] Geografia i obraz (`src/world/geography.ts`, `source.ts`, `src/view/*`): jeden własny region, spójny odpływ, różne siedliska, zbudowany z części dom, bliski i daleki ogląd. Testy kierunku odpływu, skali i możliwości przekształcenia własnej formy; geometria jest źródłem obrazu i kolizji.
- [ ] Materialne wykonanie (`src/physics/*`): dynamiczne ciała mieszkańców i rzeczy, skończony napęd, reakcja podpory, chwyt, bezpieczne odłożenie. Testy dwóch ludzi, przeszkody, masy i schodu rzeczywistego wejścia. Odpoczynek nie otrzymuje PASS za sam ruch animacji.
- [ ] Własne życie (`src/life/*`): wybór z potrzeb, preferencji i miejscowej wiedzy; brak nowego globalnego poznania z edycji. Zmęczenie po wykonaniu, odzyskiwanie sił w odpoczynku, skończona porcja, spokojny czas. Testy wpływu istotnej obserwacji, odmowy oraz dalszego wyboru bez zlecenia operatora.
- [ ] Integracja (`src/main.ts`, `src/ui/*`): sterowanie oglądem, wybór osoby/rzeczy, pauza, zapis/odczyt, edycja tej samej formy. Testy zakończonego czasu, round-trip aktywnego stanu i rzeczywistych controls. Build oraz ogląd wyrenderowanego wyniku, jeśli dostępny; żadnego Owner PASS przed feedbackiem.

## Pierwszy wykonany stan

Stan/historia, geografia/obraz, fizyka, poznanie/wybór i interfejs są już połączone w jeden runtime. Nie są pięcioma oddzielnymi produktami. Działający zakres obejmuje native przejście sześciu stopni wejścia, niesienie/odłożenie tej samej torby, niski odpoczynek/wstawanie, rzeczywisty dostęp do posiłku, dalszy wybór i lokalną zmianę istniejącej bryły.

Przegląd wyłapał i sprawdzenia odtworzyły: nieosiągalny środek jedzenia na stole, odbity znak obrotu w poznaniu, nadpisywanie zapisu świeżym światem po otwarciu oraz fałszywy sufit z broad-phase terenu. Poprawki mają regresje. Odczyt nie wykonuje obserwacji ani nie aktualizuje pamięci przed wznowieniem czasu. Zapis zawiera wersję reguły geografii; niewspierana reguła zatrzymuje odczyt bez niszczenia historii.

Przed publikacją niezależny przegląd odtworzył jeszcze import pustego świata zastępujący historię przed błędem interfejsu oraz nieobsługiwany wybór rzeczy. Zapis bez mieszkańców jest teraz jawnie niewspierany i odrzucany przed podmianą; kliknięcie rzeczy pokazuje jej aktualny stan. Oba przypadki otrzymały regresje i ponowny przegląd.

Sprawdzenia 13.10.2026: **77 testów w 7 plikach**, w tym rzeczywisty native solver i interfejs połączony z sesją. TypeScript oraz produkcyjny build przechodzą. Build ostrzega o dużym pakiecie JS; koszt na komputerze gracza pozostaje do pomiaru. Interfejs sprawdzony w JSDOM nie jest dowodem jakości WebGL.

Granice: edytujemy położenie, wymiary i obrót istniejących części; swobodne tworzenie/złożone formy pozostają do rozwinięcia. Las/woda są głównie obrazem, dach ma konserwatywną bryłę kolizji, sylwetki i ruch wymagają dalszej pracy. Wirtualne nogi i blokada pochylenia są jawną idealizacją. Nie uznano prostego odpoczynku za fizyczny siad na ławie. Mieszkańcy nie mają jeszcze bogatej gospodarki, uczenia lub pełnego dnia życia.

Kolejny ruch wynika z oglądu tej samej krainy: usunąć praktyczne słabości obrazu/ruchu, rozwinąć własne formy i przyczyny dalszego życia. Przejście testów nie zamyka tej kampanii ani nie zastępuje feedbacku Ownera.

## Kontrakty

Wspólne typy są w `src/world/types.ts`. Geografia daje wysokość i cieki, source daje jawne części i ID. Physics przyjmuje intencję prędkości, krok i chwyt; zapis zawiera dane semantyczne, nie native handles. Brain czyta prywatne obserwacje zakończonego kroku. Renderer tylko czyta stan. Rewizja następuje na granicy kroku, bez wykonania solvera pomiędzy starym i nowym kształtem.

## Ryzyka do weryfikacji

Schody i postury są nową kompetencją. Zmiana kapsuły usuwa kontakty. Odtworzenie kończy kształty/masę przed transformem i prędkościami. Zmiana layoutu lub kamery nie wykonuje czasu. Powiększanie świata zachowuje ID i istniejące ślady. Udane testy nie kwalifikują piękna, jakości ruchu lub doświadczenia Ownera.

Plan rozwija tę samą krainę; korygujemy go wobec rzeczywistych wyników i odnotowujemy pozostałe braki. Nie zamykamy pracy po samym uruchomieniu projektu.

## Przekazanie pierwszego przyrostu

Pierwsza wersja została opublikowana 13.10.2026 pod [prywatnym adresem krainy](https://mini-feniks-zywa-kraina.sweetcrane512.chatgpt.site); źródła gry są na głównej gałęzi repozytorium. Zgodność całego drzewa plików z wdrożonym źródłem została sprawdzona. Ogląd w przeglądarce doszedł do wyboru konta ChatGPT; nie uznano tego za sprawdzenie renderingu, wydajności ani doświadczenia gry.

Do wznowienia: zacząć od rzeczywistego oglądu bliskiego domu i dalekiej krainy, czytelności ludzi i działania kontroli. Nie dodawać systemów przed rozpoznaniem widocznych słabości. Następnie rozwijać tę samą całość: realne tworzenie własnych form, materialne otoczenie i dalsze własne powody mieszkańców. Lista wcześniejszych zadań pozostaje kryterium kwalifikacji; sam obecny runtime nie spełnia całej wizji.

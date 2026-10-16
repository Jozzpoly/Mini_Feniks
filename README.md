# MiniFeniks

Poważna próba zrealizowania możliwie największej części marzenia o Feniksie, na jaką pozwalają nasze możliwości. Budujemy własne dzieło, konsekwentnie rozwijając jedną całość. Nie jest to demonstrator technologii ani celowo prowizoryczna wersja przyszłej gry.

Chcemy rozległej, naturalnej i pięknej krainy w przyziemnym europejskim fantasy średniowiecznym. Niewielka lokalna wspólnota ma żyć w niej z własnych powodów: poznawać, pracować, odpoczywać, spotykać się, odmawiać i zmieniać zamiary. Ludzką skalę, materialne następstwa, prywatną wiedzę i historię oceniamy z bliska, przy zwykłym biegu czasu.

Autorstwo obejmuje tworzenie, komponowanie i wielokrotne przekształcanie miejsc, domów, przyrody oraz wyglądu. Interwencje mają następstwa w tej samej historii świata. Piękno, twórcza swoboda i życie mieszkańców rozwijają się razem.

MiniFeniks czerpie z szerokiej wizji Feniksa. Jeśli po dłuższym tworzeniu, testowaniu i graniu obroni się jako wartościowy świat, może wypracować własną tożsamość i przyszłość. Nie zamrażamy wcześniej tej relacji.

## Bieżący stan — 16.10.2026

**[Otwórz krainę](https://mini-feniks-zywa-kraina.sweetcrane512.chatgpt.site)** — prywatny podgląd właściciela; przy pierwszym wejściu wybierz swoje konto ChatGPT.

**Kampania 04:** luźne deski i cięższe materiały mają własne ciała; gracz obraca i podnosi fizyczny chwyt. Zbieranie i jedzenie trwają, można je przerwać. Mieszkańcy zaczęli troszczyć się o własny zapas w zapamiętanym miejscu: zdobywać porcje, przenosić je i odkładać. To pierwszy rodzaj ciągłej własnej sprawy, nie pełne życie osobowe lub gospodarka.

**Graj:** WASD/strzałki względem kamery, E — dostępna czynność, C — niska postura. **R / Shift+R** obraca trzymaną rzecz, **T / G** podnosi/obniża chwyt, **Esc** przerywa czynność. Mysz prowadzi kamerę. Przy jedzeniu można osobno wybrać podniesienie porcji. **Zapis → Ślad gry** przygotowuje mały plik diagnostyczny do feedbacku; pełny zapis JSON pozostaje osobną operacją.

Nowy teren łagodniej otwiera się wokół domu, ma dalszy kamienny próg oraz bardziej zróżnicowane drzewa, podszyt i wodę. Wskazane wcześniej nieudane dojścia przeszły ponowną próbę native. Jakość artystyczna i przyjemność grania nadal wymagają oceny w grze.

**Nowy świat R&D ma osobny zapis** `mini-feniks:checkpoint:living-04`. Poprzedni slot pozostaje nienaruszony; nie obiecujemy automatycznej migracji dawnego terenu. Nie otwieraj równolegle drugiej karty tej samej wersji do testów na ważnym świecie — autosave pozostaje wspólny dla originu.

**Oglądaj** pozwala obserwować ludzi i krainę. Dotychczasowe **Twórz** zachowuje podgląd/przyjęcie/anulowanie/cofnięcie całych form; jest przejściowym warsztatem. Przyszłym miejscem pełnego autorstwa pozostaje Feniks Studio.

- [Kampania 04](docs/BUILD-04.md): przyrost, rzeczywiste sprawdziany i ograniczenia.
- [Fundament](docs/FOUNDATION.md): aktualne hipotezy i granice reprezentacji.
- [Źródła i donory](docs/SOURCES.md): przypięty kod, przydatność oraz falsyfikatory.
- [Prowadzenie pracy](AGENTS.md): autoryzacja i ciągłość.
- Wcześniejsze wyniki: [01](docs/BUILD-01.md), [02](docs/BUILD-02.md), [03](docs/BUILD-03.md).
- [Wcześniejszy plan przebudowy](docs/superpowers/plans/2026-10-16-refoundation.md) zachowuje kontekst; kampania 04 zmieniła kolejność i nie wykonała go w całości.

Robocze **6×4 km** jest propozycją początkowo przygotowanej geografii, nie zatwierdzoną granicą świata. Zachowujemy możliwość jego sensownego rozwoju. Nie zamawiamy teraz nieskończonego terenu lub infrastruktury na zapas.

Runtime używa Three.js i Box3D, fizyki 60 Hz oraz wyboru z potrzeb i lokalnych świadectw. Gracz i dwoje mieszkańców działają własnymi ciałami w jednym solverze. Owoce mają skończony zapas, zebranie tworzy rzeczywistą trzymaną porcję, jedzenie rozlicza jej zużycie. Mieszkańcy rozpoznają też brak poznanej formy dopiero w miejscu, które mogą zobaczyć. Cofanie autorstwa nie cofa czasu, zjedzonych porcji lub prywatnej wiedzy.

Sprawdzian 20 minut wykonuje 72 000 native kroków bez zleceń operatora i bez odnawiania owoców. Dodatkowo dwie zmienione pozycje początkowe sprawdzają fizyczne ukończenie zapasu obok torby zostawionej przez drugą osobę. Nie kwalifikuje to całej samowystarczalnej wspólnoty. Pamięć zachowuje ostatnie 96 zdarzeń osoby; wiedza o miejscach i rzeczach ma osobne rekordy. Samotne przechodzenie testów nie wystarcza do uznania gry za dobrą.

Las i woda nadal są głównie wizualne; miejscowe rośliny zbioru są własnymi formami. Kontroler i chwyt pozostają uproszczeniami. Dach ma obecnie klin w obrazie i pudełko kolizji, a postać nie ma pełnej biomechaniki. Kolejne zmiany mogą zastąpić te rozwiązania.

## Uruchomienie i sprawdzenie

Node 22 lub nowszy: `npm ci`, następnie `npm run dev`. Produkcyjna paczka powstaje przez `npm run build`. `npm test` sprawdza dane, prywatne poznanie, źródło i rzeczywistą integrację native fizyki. Historia zapisuje się lokalnie w przeglądarce; można ją również zachować i otworzyć jako plik JSON. Ponowne otwarcie przywraca zapis tej samej generacji świata; przejście do kampanii 04 jest jawnym świeżym początkiem.

`npm run probe:approaches` wykonuje odizolowane próby chodu po obecnym i dawnym terenie. Wypisuje rzeczywiste odległości po 90 s; ukończenie skryptu nie oznacza, że dojścia działają poprawnie.

`npx vite-node scripts/probe-living.ts` obserwuje sześć minut życia przy dwóch pozycjach początkowych w lokalnym wycinku native terenu. Nie wydaje poleceń mieszkańcom. Log nie jest sam w sobie PASS-em; porównuj rzeczywiste porcje, prywatną wiedzę i zdarzenia.

# MiniFeniks

Poważna próba zrealizowania możliwie największej części marzenia o Feniksie, na jaką pozwalają nasze możliwości. Budujemy własne dzieło, konsekwentnie rozwijając jedną całość. Nie jest to demonstrator technologii ani celowo prowizoryczna wersja przyszłej gry.

Chcemy rozległej, naturalnej i pięknej krainy w przyziemnym europejskim fantasy średniowiecznym. Niewielka lokalna wspólnota ma żyć w niej z własnych powodów: poznawać, pracować, odpoczywać, spotykać się, odmawiać i zmieniać zamiary. Ludzką skalę, materialne następstwa, prywatną wiedzę i historię oceniamy z bliska, przy zwykłym biegu czasu.

Autorstwo obejmuje tworzenie, komponowanie i wielokrotne przekształcanie miejsc, domów, przyrody oraz wyglądu. Interwencje mają następstwa w tej samej historii świata. Piękno, twórcza swoboda i życie mieszkańców rozwijają się razem.

MiniFeniks czerpie z szerokiej wizji Feniksa. Jeśli po dłuższym tworzeniu, testowaniu i graniu obroni się jako wartościowy świat, może wypracować własną tożsamość i przyszłość. Nie zamrażamy wcześniej tej relacji.

## Bieżący stan — 14.10.2026

**[Otwórz krainę](https://mini-feniks-zywa-kraina.sweetcrane512.chatgpt.site)** — prywatny podgląd właściciela; przy pierwszym wejściu wybierz swoje konto ChatGPT.

**Druga kampania właściwej budowy:** do tej samej krainy weszła postać gracza, wspólne materialne czynności, całe formy z lokalnymi miejscami używania oraz bezpośrednie autorstwo z podglądem, przyjęciem, anulowaniem i cofnięciem. Zmieniliśmy źródło i zapis; dawną historię odczytujemy przez migrację. Żaden z tych fundamentów nie otrzymuje immunitetu.

**Graj**: WASD lub strzałki względem kamery, E — najbliższa dostępna czynność, C — niska postura. Mysz prowadzi kamerę. **Oglądaj** pozwala obserwować ludzi i krainę. **Twórz** zatrzymuje czas, pozwala manipulować całymi formami uchwytami i dodawać ławy, stoły, ściany, podesty, bramy oraz skały. Podgląd nie zmienia materialnego świata przed przyjęciem. Wyjście przywraca wcześniejszy stan zegara.

Pierwszy gameplay potwierdził udział gracza i ujawnił błędy kamery. Oko otrzymało prześwit nad rzeczywistym terenem; przy bliskim oglądzie postaci przesłaniające części domu pokazują przekrój. Twórz przywraca pełny widok geometrii. Te poprawki nie zmieniają kolizji, historii ani kierunku WASD; jakość całego doświadczenia pozostaje do dalszej pracy.

- [Fundament i pierwszy ruch](docs/FOUNDATION.md): decyzje robocze, możliwość rozbudowy świata, granice dowodów oraz pierwszy przyrost do oceny.
- [Źródła i nauka z donorów](docs/SOURCES.md): przypięte źródła projektów i zakres ich przydatności.
- [Instrukcje prowadzenia pracy](AGENTS.md): ciągłość, autoryzacja i uczciwa ocena rezultatów.
- [Pierwsza kampania](docs/BUILD-01.md): wynik pierwszego grania i przyczyny przebudowy.
- [Druga kampania](docs/BUILD-02.md): wykonanie, sprawdzenia i granice aktualnego przyrostu.

Robocze **6×4 km** jest propozycją początkowo przygotowanej geografii, nie zatwierdzoną granicą świata. Zachowujemy możliwość jego sensownego rozwoju. Nie zamawiamy teraz nieskończonego terenu lub infrastruktury na zapas.

Runtime używa Three.js i Box3D, fizyki 60 Hz oraz wyboru z potrzeb i lokalnych świadectw. Gracz i dwoje mieszkańców działają własnymi ciałami w jednym solverze. Owoce mają skończony zapas, zebranie tworzy rzeczywistą trzymaną porcję, jedzenie rozlicza jej zużycie. Mieszkańcy rozpoznają też brak poznanej formy dopiero w miejscu, które mogą zobaczyć. Cofanie autorstwa nie cofa czasu, zjedzonych porcji lub prywatnej wiedzy.

Sprawdzian 20 minut świata wykonał 72 000 native kroków bez zleceń operatora. Mieszkańcy zużyli 14 z 42 porcji owoców; ich końcowy głód wyniósł około 0,50 i 0,58, zamiast dawnego 1. To poprawa konkretnego mechanizmu, nie kwalifikacja samodzielnej gospodarki lub ciekawej gry. Zapas nie odnawia się automatycznie. Pamięć przechowuje ostatnie 96 zdarzeń osoby; poznane miejsca i tożsamości zachowują odrębne rekordy.

Obraz i fizyka korzystają z tej samej triangulacji terenu. Skoki podłoża i wpływ dalekiego odpływu na dno górnego potoku zostały usunięte. Piękno i naturalność całej mapy pozostają do dalszego doskonalenia. Las i woda nadal mają głównie reprezentację wizualną; miejscowe rośliny zbioru są już własnymi formami. Kontroler, chwyt i postura są podpartymi uproszczeniami, a nie pełną biomechaniką lub siadem na ławie.

Testy wykonują prawdziwy solver i rzeczywiste interakcje interfejsu w JSDOM. Brak dostępnej przeglądarki do lokalnego QA oznacza, że użyteczność uchwytów WebGL, kompozycję, wydajność grania oraz układ mobilny trzeba ocenić w działającej grze. Techniczny wynik nie zastępuje opinii Ownera.

## Uruchomienie i sprawdzenie

Node 22 lub nowszy: `npm ci`, następnie `npm run dev`. Produkcyjna paczka powstaje przez `npm run build`. `npm test` sprawdza dane, prywatne poznanie, źródło i rzeczywistą integrację native fizyki. Historia zapisuje się lokalnie w przeglądarce; można ją również zachować i otworzyć jako plik JSON. Ponowne otwarcie przywraca zapis, a nie tworzy po cichu nowego świata.

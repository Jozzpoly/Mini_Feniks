# MiniFeniks

Poważna próba zrealizowania możliwie największej części marzenia o Feniksie, na jaką pozwalają nasze możliwości. Budujemy własne dzieło, konsekwentnie rozwijając jedną całość. Nie jest to demonstrator technologii ani celowo prowizoryczna wersja przyszłej gry.

Chcemy rozległej, naturalnej i pięknej krainy w przyziemnym europejskim fantasy średniowiecznym. Niewielka lokalna wspólnota ma żyć w niej z własnych powodów: poznawać, pracować, odpoczywać, spotykać się, odmawiać i zmieniać zamiary. Ludzką skalę, materialne następstwa, prywatną wiedzę i historię oceniamy z bliska, przy zwykłym biegu czasu.

Autorstwo obejmuje tworzenie, komponowanie i wielokrotne przekształcanie miejsc, domów, przyrody oraz wyglądu. Interwencje mają następstwa w tej samej historii świata. Piękno, twórcza swoboda i życie mieszkańców rozwijają się razem.

MiniFeniks czerpie z szerokiej wizji Feniksa. Jeśli po dłuższym tworzeniu, testowaniu i graniu obroni się jako wartościowy świat, może wypracować własną tożsamość i przyszłość. Nie zamrażamy wcześniej tej relacji.

## Bieżący stan — 13.10.2026

**[Otwórz krainę](https://mini-feniks-zywa-kraina.sweetcrane512.chatgpt.site)** — prywatny podgląd właściciela; przy pierwszym wejściu wybierz swoje konto ChatGPT.

**Po pierwszym rzeczywistym graniu: implementacja wstrzymana na polecenie Ownera; trwa analiza fundamentu.** Pierwszy przyrost został uruchomiony, lecz doświadczenie życia i autorstwa wymaga gruntownej poprawy. Gracz ma być pełnoprawnym aktorem tej samej krainy. [Ocena i dalsze zależności](docs/BUILD-01.md#ocena-po-pierwszym-graniu).

**Właściwa budowa rozpoczęta po jawnej zgodzie Ownera 13.10.2026.** Powstał pierwszy działający przyrost jednej krainy: geografia 3D, dom z części i rzeczywistym wejściem, dwoje mieszkańców, materialna torba, prywatna wiedza, potrzeby, miejscowa edycja oraz zapis historii. Repozytorium pozostaje trwałym źródłem projektu.

- [Fundament i pierwszy ruch](docs/FOUNDATION.md): decyzje robocze, możliwość rozbudowy świata, granice dowodów oraz pierwszy przyrost do oceny.
- [Źródła i nauka z donorów](docs/SOURCES.md): przypięte źródła projektów i zakres ich przydatności.
- [Instrukcje prowadzenia pracy](AGENTS.md): ciągłość, autoryzacja i uczciwa ocena rezultatów.
- [Pierwsza kampania](docs/BUILD-01.md): wykonanie, sprawdzenia i granice bieżącego przyrostu.

Robocze **6×4 km** jest propozycją początkowo przygotowanej geografii, nie zatwierdzoną granicą świata. Zachowujemy możliwość jego sensownego rozwoju. Nie zamawiamy teraz nieskończonego terenu lub infrastruktury na zapas.

Pierwszy runtime używa Three.js i Box3D, fizyki 60 Hz oraz rzadszego wyboru z potrzeb i lokalnych świadectw. Mieszkańcy potrafią przejść własne wejście, odłożyć tę samą torbę, przyjąć niską posturę odpoczynku, wstać, podejść do skończonej porcji i wybrać dalszy zamiar. Edycja zmienia istniejącą część; nie jest jeszcze pełnym edytorem budowania krainy. Las i woda mają obecnie głównie reprezentację wizualną. Postura jest uproszczeniem, nie kwalifikacją biomechaniki lub siadu na ławie.

Pierwszy ogląd potwierdził uruchomienie obrazu, lecz nie przyjęcie jakości gry. Diagnoza 20 minut niezmienionej symulacji wykazała wyczerpanie możliwości życia. Edytor ujawnił rozdzielenie materialnych form od miejsc używania, a analiza geografii — nieciągłości wysokości i różnice między podłożem obrazu oraz fizyki. Testy podkompetencji nie kwalifikują tych wartości; aktualny postój i konkretne dowody opisuje ocena pierwszego grania.

## Uruchomienie i sprawdzenie

Node 22 lub nowszy: `npm ci`, następnie `npm run dev`. Produkcyjna paczka powstaje przez `npm run build`. `npm test` sprawdza dane, prywatne poznanie, źródło i rzeczywistą integrację native fizyki. Historia zapisuje się lokalnie w przeglądarce; można ją również zachować i otworzyć jako plik JSON. Ponowne otwarcie przywraca zapis, a nie tworzy po cichu nowego świata.

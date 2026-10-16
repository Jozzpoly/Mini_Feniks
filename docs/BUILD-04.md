# Kampania 04 — rzeczy, własne sprawy i otwarta kraina

16.10.2026 · duża budowa po nowej jawnej zgodzie Ownera. Wykonanie i granice dowodów.

## Co zmieniliśmy

Wspólne przenoszenie i układanie rzeczy, trwające czynności oraz pierwsze własne zapasy mieszkańców rozwijamy razem z dojściami i krajobrazem. Wcześniejsza kolejność „najpierw doskonała reprezentacja” została odrzucona. Nie powstała konkurencyjna gra lub nowy uniwersalny silnik.

- **Fizyczny chwyt:** gracz może obracać oraz zmieniać wysokość niesionej rzeczy. Napęd ma skończoną siłę 120 N, moment 18 N·m i przeciwną reakcję na native ciało. Podatność zależy od rzeczywistych mas. Deski, dębowy klocek i kamień są materialnymi rzeczami o masie z objętości/gęstości; cięższej rzeczy nie da się dowolnie unieść tym napędem. Nie ma jeszcze łączenia, cięcia i ścinki.
- **Praca w czasie:** zbiór trwa 2,4 s, jedzenie 3,2 s; ruch/utrata dostępu przerywa pracę bez wytworzenia porcji lub ubytku zasobu. Zapis zachowuje postęp, a ukończenie ponownie sprawdza aktualny świat. Gracz i mieszkańcy korzystają z tej samej ścieżki. Bezpośredni `executeAction` jest końcowym materialnym zatwierdzeniem, nie symulacją czasu.
- **Pierwsza własna sprawa:** mieszkaniec wybiera znane miejsce zapasu, pamięta jego cel, zbiera lub przenosi znane luźne porcje i odkłada je. Wybór używa prywatnych obserwacji i kosztu drogi, nie globalnego licznika jedzenia. Pilny głód może przerwać zamiar; brak dojścia uruchamia przerwę przed ponowną próbą. To jedna skromna kompetencja, nie osobowość, planowanie całego życia ani gospodarka wspólnoty.
- **Materialny dostęp:** te same obrócone pudełka przesłaniają sięganie/poznanie. Routing uwzględnia poznane luźne przeszkody, również trzymane przez inną osobę. Dostępność do podniesienia jest odrębna od zapamiętanej obecności. Zdalna zmiana nie aktualizuje wiedzy; lokalnie zobaczone otwarcie może zmienić drogę.
- **Przebywanie w krainie:** szersze łagodne przejście wokół domu, poprawione dojścia na skraj, zachód i północ, bardziej zróżnicowane korony, podszyt i woda, stół na skraju polany oraz dalszy kamienny próg. Pozostaje jedna mapa 6×4 km. Zmęczenie i głód narastają wolniej, żeby zwykły spacer nie stawał się natychmiastowym zarządzaniem kryzysem.
- **Kontakt z graczem:** osobno podnoszenie i jedzenie, widoczny postęp czynności, sterowanie chwytem, podgląd troski mieszkańca, mały lokalny „Ślad gry” do feedbacku. Plik diagnostyczny nie jest pełnym checkpointem ani usługą wysyłającą nagrania.

## Błędy, które podważyły pierwszą integrację

1. Stałe sprężyny dobre dla torby 3 kg rozkołysywały porcję 0,18 kg i zrywały chwyt. Nowe próby native wykazały stabilny względny ruch obu mas; uwzględniono również przeciążenie i przeciwne impulsy.
2. Testy jednostkowe nie wykryły planowania przez niski blok: promień przechodził na wysokości głowy. Niezależny przegląd odtworzył problem; po filtrowaniu pionowego nakładania ciała routing sprawdza poziomy obrys przeszkody. Oddzielono też obecność rzeczy od jej dostępności oraz dodano przerwę przy zablokowanym zapasie.
3. Uczciwsze omijanie ujawniło z kolei zablokowany punkt zapasu przez torbę drugiego mieszkańca i błędne semantyczne oznaczenie podmurówki jako belki. Podmurówka jest teraz podporą podłogi (bez zmiany collidera), a odkładająca osoba podchodzi do bliższego brzegu akceptowanego zasięgu. Odkładanie nadal wymaga rzeczywistej odległości i małej prędkości, bez teleportu.
4. Dwuminutowy zwykły chód podnosił zmęczenie gracza do ~0,678. Nowy rytm utrzymuje je poniżej 0,4; nie udajemy przez to realistycznej fizjologii lub cyklu dobowego.

## Dowody i ich zakres

- Baseline: 145 testów w 21 plikach. Pierwszy pełny run integracji miał dwa błędy i timeout obciążonego równolegle workera; nie jest PASS-em.
- Pełny run przed ostatnimi poprawkami przeglądu: 176/176. Końcowy run po poprawkach: **181/181 testów w 30 plikach, 79,81 s**, bez równoległych ciężkich prób. Zawiera 20 minut świata i dwie próby ukończenia zapasu.
- Native dojścia po 90 s: skraj 0,044 m, zachód 0,053 m, północ 0,039 m od celu. Wcześniejsze nieudane pozycje miały 5,28 i 24,64 m. To kwalifikacja konkretnych tras, nie całej mapy.
- `tests/provisioning.test.ts`: dwa starty Miry przesunięte o 7 m; bez zlecania sekwencji, w rzeczywistej fizyce. Oba testy najpierw nie ukończyły zapasu po sześciu minutach, a po poprawce dojścia potwierdzają realne dostępne porcje oraz zdarzenia odłożenia. Torba drugiej osoby pozostaje w świecie. Próba używa 200×200 m native wycinka tej samej geografii, nie mierzy FPS pełnej krainy.
- Niezależny przegląd odtworzył trzy konkretne błędy i potwierdził ich poprawki. Dodatkowa próba konkurujących zapisanych zbiorów tworzy jedną porcję i jeden ubytek zasobu.

## Zapis i ograniczenia

Nowy slot to `mini-feniks:checkpoint:living-04`. Dawny `mini-feniks:checkpoint` nie jest odczytywany jako nowa geografia ani nadpisywany. To świadomy świeży początek R&D, nie obietnica migracji. Nie wykonano w tej kampanii potwierdzonego pobrania zewnętrznej kopii starego świata Ownera. Wielokartowy autosave nie został przebudowany.

Po odczycie chwyt zachowuje bieżącą orientację rzeczy; oczekujący cel obrotu nie ma jeszcze pełnej serializacji. Routing jest uproszczonym grafem prywatnych obrysów, bez pełnego planowania przestrzennego ani niezawodnego wykrywania oscylacji. Dach nadal ma klin w obrazie i pudełko kolizji. Las jest głównie wizualny; żaden widoczny las nie otrzymał tu pełnej fizycznej tożsamości lub ścinki. Sam wzrost szczegółowości nie kwalifikuje naturalności i jakości artystycznej.

Nie rozszerzono drugiego Studia, nie zintegrowano importerów, LLM/API, uniwersalnej materii voxelowej lub budowania z połączeniami. Te granice pozostają otwarte na realne kolejne potrzeby gry.

## Końcowe wykonanie

Pełne testy, kontrola TypeScript i niezależny przegląd zostały wykonane. Publikacja oraz próba nowej wersji w Operze są kolejnymi krokami; ich wyniku nie wyprzedzamy. Techniczne PASS-y nie zastępują grania Ownera.

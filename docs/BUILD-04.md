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

**Dostarczone do oceny:** produkcyjny build TypeScript/Vite zakończył się poprawnie; końcowa korekta typu celu `quiet` nie zmienia zachowania. Pełne 181 testów oraz przegląd opisano powyżej. Kod gry opublikowano pod dotychczasowym prywatnym adresem (bez zmiany odbiorców):

- źródło Sites `322d8d951e087558c63817b01c3e738d7d451400`;
- publiczny GitHub `698a0b9402410c78c7c38486215a6c1ec470f7f3`;
- identyczne drzewo `54101d89b84e2b7b35f40aa31639e9aa0e7947ce`;
- udane wdrożenie `appgdep_6ad2392b231c8191a671b24a69a5cbcd`.

**Próba w Operze na tej wersji:** rzeczywisty obraz GPU, kamera/obserwacja Miry i wykonana sprawa zapasu; przełączenia Graj/Twórz/Oglądaj; widoczny upływ i zatrzymanie czasu; zmiana położenia rośliny przez istniejący interfejs; rozpoczęcie, zapis oraz odczyt częściowo ukończonego zbioru (2,0 s → 1,5 s po wznowieniu); Esc i nowa próba; realna trzymana porcja, R/T oraz przyciski chwytu, puszczenie, odrębne przyciski podniesienia i jedzenia, przerwanie jedzenia i późniejsze ukończenie. Przywrócono pierwotne położenie rośliny przez zwykłą zmianę autora; przeżytych skutków nie cofnięto. To była kontrolowana próba R&D, nie kwalifikacja swobodnego spaceru.

Po przygotowaniu „Śladu gry” interfejs prawidłowo zgłosił wyciąg do pobrania, lecz oczekiwanie na potwierdzenie pobranego pliku zakończyło się utratą połączenia narzędzia. Pobrania nie uznajemy za potwierdzone. Log konsoli nie pokazał błędu wykonania; pokazał ostrzeżenie Three.js o przestarzałym PCFSoftShadowMap.

Nie potwierdzono FPS, układu mobilnego ani długiego chodu w tym browserze: krótkie zdarzenia klawiatury automatyzacji nie ustanowiły ciągłego napędu. Postura C działała; sterowanie oraz przejścia mają odrębne testy native/JSDOM. Zrzut i poprawny build nie zastępują doświadczenia Ownera.

Końcowa obserwacja sześciu minut przy obu pozycjach startowych wykazała wykonany zapas obu mieszkańców i późniejszą ciszę; po pięciu odłożeniach nie produkowali nieskończonego ruchu dla aktywności. Nie jest to jeszcze dowód bogatego życia: po spełnieniu potrzeb i tej jednej sprawy mają mało sensownych możliwości. Następna kampania powinna otworzyć trwałe używanie/przekształcanie rzeczy oraz bogatsze powody działania, razem z jakością ruchu, wyglądu i odkrywania. Nie dokładamy samych nazw zamiarów lub sztucznej kolejki zajęć. Żaden obecny mechanizm nie otrzymuje immunitetu.

Powyższe piny wskazują pierwszy opublikowany przyrost kodu gry. Dokument domknięcia kampanii jest zapisywany późniejszym commitem; nie zmienia tego kodu.

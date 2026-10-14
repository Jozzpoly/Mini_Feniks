# Fundament i pierwszy ruch

13.10.2026 · fundament roboczy · implementacja rozpoczęta po jawnej zgodzie Ownera

**Aktualizacja 14.10.2026:** Owner zakończył postój i zatwierdził wznowienie implementacji oraz przebudowy. Poniższy tekst zachowuje kontekst pierwszej hipotezy, nie aktualną listę chronionych rozwiązań. [BUILD-02.md](BUILD-02.md) opisuje rzeczywistą drugą kampanię: postać gracza, formy i własne użycia, materialne próby, podłoże oraz dalsze miejscowe możliwości życia.

Zapis drugiej budowy ma schemat 2: źródłami są lokalne formy i swobodne miejsca; płaskie części, miejsca oraz pozycje zasobów odbudowujemy jako projekcje. Historia autora dotyczy wskazanego zakresu, nie całego życia. Dawny schemat 1 i podłoże mają jawną migrację tej samej historii. Obecny wykonawca ma budżet triangulacji; to granica kosztu tej implementacji, nie ostateczny rozmiar świata.

**Decyzja Ownera o braku immunitetu:** wszystkie opisane tutaj techniki oraz zalecenia zachowania są odwoływalnymi hipotezami, również podział stanu, model tożsamości, czas, solver i kontroler. [AGENTS.md](../AGENTS.md) ma pierwszeństwo przed dawnym planem; [aktualny osąd](BUILD-01.md#osąd-po-decyzji-ownera-i-ponownym-odczycie-donorów) nie ratyfikuje fundamentu.

## Osąd gotowości

Cel i najważniejsze zależności są dostatecznie rozpoznane, żeby zaproponować pierwszy wspólny przyrost. Dalsze ogólne audyty oraz doskonalenie pełnego projektu przyniosą obecnie mniej niż budowa po osobnej zgodzie Ownera. Skuteczność kontaktu, postur, żywej rewizji i dalszego życia wymaga uruchomienia; nie można jej zamknąć opisem.

Przed kodem potrzebujemy decyzji roboczych, właścicieli i warunków ich zmiany. Nie potrzebujemy już działającego katalogu czynności, gotowego solvera mieszkańca albo udowodnionej persystencji jako warunków rozpoczęcia ich implementacji.

## Jeden świat, własność stanu i wykonania

Robocza droga uruchomienia: przeglądarka, TypeScript i Three.js/WebGL2, ciągłe formy 3D w metrach. To wybór wykonawczy do oceny na treści tej krainy, nie zatwierdzenie finalnego stylu lub kamery.

| Granica | Decyzja robocza |
| --- | --- |
| Źródło autora | Definicje, kompozycje, materiały i ich rewizje są odrębne od skutków życia konkretnych instancji. Poprawka zmienia wskazany zakres; nie przywraca wyposażenia lub warunków początkowych. |
| Ustanowiony stan | Osoby, rzeczy, części i użycia mają trwałą tożsamość. Obecne położenie, posiadanie, zużycie i postęp należą do tej samej historii. |
| Wspólny krok | Jeden koordynator publikuje zakończony stan. Czas świata rośnie po wykonanych krokach; kamera, layout i pominięty czas ścienny go nie wykonują. |
| Ciało i czynność | Jeden wykonawca osoby prowadzi ruch, posturę, chwyt i przerwanie. Brain zadaje intencję; animacja i panel nie poprawiają równolegle położenia. |
| Poznanie | Miejscowe świadectwa z czasem/źródłem zmieniają prywatną pamięć. Aktualizacja geometrii lub ogląd autora nie daje mieszkańcowi nowej mapy. |
| Możliwości | Potrzeby, preferencje, relacje i własna historia tworzą propozycje działania. Spokojny czas i odmowa są dozwolone. Skończone początkowe sprawy nie są całym życiem. |
| Reprezentacja | Mesh, collider, indeks i native handle można odbudować. Nie są tożsamością rzeczy ani zapisem świata. |

Rozległość, obraz, własne formy i mieszkańcy rozwijają się w jednej kompozycji. Liczba modułów, postaci lub kilometrów nie kwalifikuje jakości.

## Pierwsza hipoteza materialna

Proponuję **jedno dynamiczne ciało Box3D na mieszkańca**, początkowo o uproszczonej geometrii kapsuły. Wspólny solver rozstrzyga kontakty ludzi i rzeczy. Jeden wykonawca zadaje ograniczony napęd względem osiągalnej podpory oraz prowadzi posturę; nie koryguje transformu teleportem lub kopią pozycji innego controllera.

V1 jest źródłem doświadczeń, zapytań o podparcie i referencji zachowania. Nie działa jako równoległy właściciel ciała. Ten wybór zastępuje wcześniejsze pierwszeństwo przeniesienia analitycznego movera V1 do Krainy. Zmieniamy model wykonania; dotychczasowa kwalifikacja V1 zachowuje własny zakres.

**Nowy koszt jest istotny:** chód, schody, tarcie, stabilizacja, siadanie i noszenie wymagają własnej kwalifikacji. Samo dynamiczne ciało z poziomą siłą nie jest kompetentnym człowiekiem. Podnoszenie na stopień wymaga osiągalnego podparcia, prześwitu i skończonego wysiłku; reakcja na dynamiczną podporę trafia do niej przeciwnie. Brak warunków oznacza zatrzymanie lub upadek. Nie tworzymy pionowego napędu utrzymującego osobę w powietrzu.

Odczyt rzeczywistego `SolverOwnedCharacter` oraz konstrukcji prób E2 potwierdza, że donor miał już nieruchomą względem obrotu native kapsułę z ograniczonym poziomym napędem. Historyczny zapis E2 wskazuje blokadę zwykłych stopni mimo zwiększania napędu i tarcia; nie powtórzono teraz tej próby. Z kolei native `SetCapsule` w wybranym pinie usuwa kontakty zmienianego kształtu. Zmienna postura wymaga jawnej polityki masy, jej środka i bezwładności; nie jest bezkosztową interpolacją bryły. Jedna osoba nie musi oznaczać jednej niezmiennej kapsuły. Źródła i dokładny zakres dowodów są w [SOURCES.md](SOURCES.md).

Napęd ruchu i stabilizacja orientacji mają jawne ograniczenia siły oraz momentu. Ewentualne ograniczenie obrotu musi być zadeklarowaną idealizacją, nie dowodem fizycznej równowagi. Postura jest jawną idealizacją sterowanego ciała. Ciągła zmiana respektuje zajętą przestrzeń i rzeczywiste podparcie. Nie deklarujemy pełnej biomechaniki. Matematyka E19 może pomóc w chwycie, ale jej punktowa masa nosiciela i `playerDeltaV` nie są gotowym modelem dwóch native ciał. Adaptacja musi uwzględnić punkty oraz bezwładność obu stron, jawne limity i pojedynczą reakcję.

Box3D z wiązaniem 0.1.1 jest roboczym kandydatem. Nie wykazano przewagi kosztu lub gotowości nowej całości. Zmienimy napęd, model ciała lub adapter, jeżeli kontakt wymaga narastających wyjątków albo kompetencja nie daje się osiągnąć. Zachowujemy źródło krainy, ID i jej sens przy tej zmianie. Referencja V1 pomaga ocenić regresję; nie budujemy osobnych konkurencyjnych światów.

## Rozbudowa krainy bez infrastruktury na zapas

6×4 km opisuje hipotezę początkowo przygotowanej treści. Nie jest wymiarem tożsamości świata, formatu zapisu lub pamięci mieszkańca.

- Geografia zachowuje ustalony układ metrowy, początek, osie i odniesienie wysokości. Rozrost nie skaluje lub centruje ponownie dawnych miejsc. Przyjmujemy geograficzne wschód/północ/wysokość; adapter 3D ma jawne przejście do prawoskrętnego X=wschód, Y=góra, Z=południe.
- ID nie pochodzi z szerokości mapy, indeksu chunka, numeru trójkąta lub kolejności generowania. Zmiana podziału przechowywania nie zmienia osoby, rzeczy lub części domu.
- Ustanowiona treść jest przypisana do wersji reguły, parametrów i ziarna oraz własnych poprawek. Sam seed nie chroni historii. Dodanie nowej ziemi nie przelosowuje starego lasu, nie odtwarza usuniętej rośliny i nie nadpisuje autorskiej polany.
- Granica przygotowanej treści jest odrębna od naturalnego końca rzeki lub świata. Przekroczenia cieków przechowują połączenie, poziom i kierunek oraz jawnie nieokreślony dalszy zakres. Nowa zlewnia wymaga uzgodnienia z istniejącą geografią.
- Powiększenie jest zakresem autorskiej zmiany bieżącego świata. Mieszkaniec zachowuje dawną wiedzę; nowe połączenie poznaje przez doświadczenie lub lokalną wiadomość.

Pierwszy runtime może mieć jeden solver i stały lokalny frame. Światowe współrzędne oraz binding adaptera są rozdzielone, ale nie implementujemy teraz wielu solverów, floating origin, rozproszonej symulacji lub nieskończonego streamingu. Precyzja i koszt realnego zasięgu wymagają pomiaru. Większe potrzeby mogą uzasadnić zmianę reprezentacji, nie zmianę historii.

Próba projektowa rozrostu: dołączyć ziemię za znanym grzbietem, gdy osoba niesie torbę, stołek ma częściową pracę, a stary las zawiera poznane i usunięte drzewo oraz własną polanę. Kontrakt obala potrzeba resetu, renumeracji, przelosowania, zdalnego poznania drogi lub cichej zmiany poziomu starego cieku. To scenariusz do późniejszej weryfikacji, nie wykonana próba runtime'u.

## Pierwszy uzasadniony ruch po zgodzie

**Uruchomić początek tej krainy: rozległą własną geografię, użyteczny dom, dwoje mieszkańców z własnymi powodami i materialną torbę, od razu w zapisywalnej oraz poprawianej historii.**

Budowa jest inkrementalna. Najpierw powstają rzeczywiste rekordy tego miejsca, wspólny krok, obraz i materialne wykonanie. Do tej samej całości wchodzą lokalna poprawka i pierwszy odczyt, potem bogatsza kompozycja formy, dalsze możliwości oraz kolejne osoby. Wewnętrzny stan pośredni nie jest osobnym produktem lub uzasadnieniem zakończenia pracy.

**Najwcześniejszy sprawdzian ciała odbywa się w tym domu:** ta sama osoba z tą samą torbą przechodzi rzeczywiste wejście, odkłada rzecz i przechodzi do odpoczynku oraz z powrotem. Sprawdzamy stopień, reakcję ciężaru, odtwarzanie kontaktów przy zmianie postury i zablokowane rozwinięcie ciała obok przeszkody. Nie zastępujemy wejścia rampą diagnostyczną ani odpoczynku samą animacją. Teleport, przenikanie, anulowanie reakcji torby lub pionowy napęd podnoszący bez osiągalnej podpory obalają bieżącą hipotezę. Poprawiamy ją w tej samej krainie przed dokładaniem czynności; kompozycja geografii, obrazu i własnych powodów mieszkańców może postępować równolegle.

Dom ma własne źródło części, wejście ze schodami, powierzchnię odkładania i miejsce odpoczynku. Region od początku ma kompozycję dolin/grzbietów, odpływu, siedlisk i dalszych miejsc. Szkic profili, pusta panorama lub równomierny scatter nie kwalifikują naturalności. Charakter obrazu i czytelność zwykłej czynności poprawiamy od początku. Konkretna mapa, wymiary i historie osób pozostają propozycjami.

Pierwszy checkpoint obejmuje definicje/rewizje, obecne instancje, zakończony czas, wykonane skutki, osoby, ich sprawy i prywatną pamięć. Aktywny chwyt/podparcie odnoszą się do trwałej rzeczy/części, lokalnego miejsca i wersji geometrii. Reprezentacje odbudowujemy i walidujemy przed wznowieniem. Nie obiecujemy identycznych warm-startów solvera lub migracji wszystkich dawnych eksperymentów.

Odczyt ma jawny porządek: finalne kształty i masa, końcowy transform z poprawną bezwładnością, zapisane prędkości, następnie związki oraz dopiero wykonanie. Sam brak manifoldów przed pierwszym wznowionym krokiem nie dowodzi utraty zapisanej podpory. Tę kolejność sprawdzimy także na obróconej niesymetrycznej rzeczy, przed pierwszym impulsem chwytu.

Pierwsza rewizja zachowuje części i użycia, zmienia wskazany zakres i ponownie sprawdza bieżące zajęcie. Konflikt z człowiekiem, aktywnym chwytem lub używaną podporą wstrzymuje przyjęcie. Bogatsza przebudowa dotyczy własnej wnęki/skraju tego samego domu, ze wskazanym następstwem podzielonej części. Prowadzący przygotuje formę; Owner nie otrzymuje zadania programowania lub obowiązkowego modelowania.

Pierwsza lokalna wymiana geometrii zachowuje istniejące native ciało, przygotowuje i sprawdza nowe kształty, a następnie usuwa stare w zatrzymanej granicy wspólnego kroku. Nie wykonujemy kroku ze zdublowaną geometrią. Nieudane przygotowanie pozostawia poprzednią wersję; masę finalizujemy po udanej wymianie. Adapter odróżnia skutki wycofania reprezentacji od rzeczywistego puszczenia przedmiotu lub utraty podparcia. Aktualna ścieżka API nie wymaga resetu świata, ale nie jest jeszcze działającą transakcją MiniFeniksa.

Pierwszy **wynik do oceny** obejmuje łącznie:

1. Rzeczywiste dojście, odłożenie tej samej rzeczy, odpoczynek oraz kontakt z drugim człowiekiem. Blokada lub zwolnienie chwytu nie daje przenikania/ukrytego wystrzału.
2. Przyjętą bezpieczną poprawkę własnej formy i czytelnie odrzucony konflikt zajęcia. Zapis/odczyt zachowuje wykonany skutek i prywatną ciągłość; oddalenie kamery nie resetuje miejsca.
3. Rozważenie następnego działania po początkowej sprawie albo uzasadnionego spokoju. Lokalna zmiana przesłanek wpływa na właściwy wybór; nie wymaga kolejnego zlecenia operatora.
4. Ludzkie proporcje, czytelne wykonanie i charakter szerokiego oraz bliskiego oglądu. Koszt przygotowania/poprawki treści oceniamy osobno od wydajności pustego renderera.

Te zachowania kwalifikujemy **podczas budowy**, przed uznaniem wspólnego wyniku za przyjęty. Brak kontaktowej wzajemności zatrzymuje dokładanie czynności, lecz nie musi zatrzymać komponowania i oglądu tej samej krainy. Drobną próbę diagnostyczną kończymy wyjaśnieniem konkretnej przyczyny.

Zgoda na implementację została udzielona 13.10.2026. Powstał pierwszy wspólny runtime tej krainy; bieżące wykonanie i granice zapisujemy w [BUILD-01.md](BUILD-01.md). Podczas budowy pierwsza hipoteza otrzymała skończony napęd wirtualnych nóg, native ciała i wzajemny podatny chwyt torby. Niska postura odpoczynku jest podpartym uproszczeniem; nie kwalifikuje jeszcze siadu na ławie. Pierwsza ocena doświadczenia ujawniła istotne braki; późniejszy postój zakończyła jawna zgoda Ownera z 14.10.2026, opisana na początku dokumentu i w AGENTS.md. Dalsze wykonanie jest w BUILD-02.md.

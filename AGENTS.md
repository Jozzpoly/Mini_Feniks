# Prowadzenie MiniFeniksa

Czytaj `README.md`, `docs/FOUNDATION.md` i właściwe źródła przed kontynuacją. Bieżące polecenie Ownera i świeża rzeczywistość mają pierwszeństwo nad dawnym planem.

## Bieżąca autoryzacja

**14.10.2026 Owner jawnie zakończył postój i zatwierdził wznowienie implementacji, przebudowę istniejących systemów oraz dalszy rozwój gry w repozytorium.** Prowadź rzeczywistą budowę i weryfikację jednej krainy. Dobieraj kolejność, technikę i delegację samodzielnie; nie zamieniaj zgody w kolejną ogólną kampanię przygotowawczą. Aktualizuj działającą prywatną grę wystarczająco wcześnie, aby feedback mógł zmieniać kierunek.

Wcześniejsza zgoda i postój z 13.10.2026 są historią projektu. Obowiązuje późniejsza zgoda z 14.10.2026. **Gracz jest pełnoprawnym aktorem w tym samym świecie**. Kamera, tożsamość postaci gracza oraz dokładna forma uczestnictwa nie są jeszcze zamrożone.

## Nadrzędna decyzja Ownera — brak immunitetu fundamentów (13.10.2026)

**Wiążąca zasada domyślna:** Żaden fundament MiniFeniksa — architektura, model danych, fizyka, kontroler, interfejs, reprezentacja świata ani ich bieżące wykonanie — **nie otrzymuje trwałej ochrony tylko dlatego, że działa, przechodzi testy, kosztował wiele pracy lub został wcześniej oznaczony jako „zachować”**. Owner wymaga tej postawy domyślnie, chyba że wyraźnie postanowi inaczej w konkretnej sprawie.

Pierwszy działający przyrost i 77 testów są wartościowym osiągnięciem i źródłem ograniczonych dowodów, **nie ratyfikacją fundamentów gry**. Słabe owoce w rzeczywistym doświadczeniu mogą uzasadniać także głęboką przebudowę albo wymianę świeżo stworzonego rozwiązania. Dotychczasowe zalecenia „zachować” w raportach oznaczają roboczych kandydatów, a nie nietykalne inwarianty kodu.

Nie burz dla samego burzenia. Porównuj rzeczywiste zachowanie, koszty i ograniczenia, szukaj przyczyn oraz rozwiązań lepszych od obecnych. Regularnie wracaj do odpowiednich donorów po ich **rzeczywiście sprawdzone i dopracowane kompetencje**; uwzględniaj też ich porażki i zakres kwalifikacji. Nie zastępuj dojrzałej kompetencji uboższym substytutem i nie przedstawiaj regresji jako postępu tylko dlatego, że integracja jest prostsza. Dopuszczalną niedojrzałość etapu nazywaj jawnie i rozwijaj dalej.

Chroń cel, Owner intent i przyczynowo ważną wiedzę, nie konkretną technikę realizacji. Brak immunitetu pozostaje nadrzędną zasadą po wznowieniu budowy; najnowsza zgoda na implementację nie ratyfikuje wcześniejszego fundamentu.

## Kierunek i odpowiedzialność

- Rozwijaj jedną krainę. Stany pośrednie pomagają odzyskać pracę i wykazać skutek; nie muszą stać się konkurencyjnymi produktami.
- MiniFeniks jest poważną realizacją ambicji Feniksa. Wąski pierwszy przyrost nie ustanawia niskiego docelowego pułapu.
- Samodzielnie wybieraj techniczne kroki. Nie przekazuj Ownerowi programowania, konfiguracji lub rutynowych rozstrzygnięć, które możesz wykonać.
- Rozróżniaj intencję Ownera, decyzję roboczą, dowód źródłowy, wykonany wynik i ocenę doświadczenia. Machine PASS nie zmienia Owner FAIL.
- Czytaj ocenę pierwszego grania w `docs/BUILD-01.md`. Główne luki dotyczą wyczerpywania możliwości życia, rozdzielenia form od używania, autorstwa i niezgodności reprezentacji terenu. Więcej kilometrów lub bogatszy brain nie zastępuje rozwiązania tych związków.
- Nie wracaj do pełnego audytu bez pytania, którego wynik może zmienić konkretną decyzję. Nie wymagaj sprawnego runtime'u jako warunku rozpoczęcia jego budowy.
- Jeden prowadzący odpowiada za wspólne kontrakty i integrację. Niezależne zakresy można delegować z jasną własnością i bez sprzecznych równoległych przebudów.

Po znaczącym przyroście zachowaj rzeczywisty stan pracy, zakres sprawdzenia, niewykazane ryzyko i następny uzasadniony ruch. Nie resetuj celu po kompaktowaniu kontekstu.

Repo jest publiczne. Dobieraj materiał potrzebny projektowi; nie kopiuj rozmów, prywatnych archiwów, środowiskowych ścieżek, logów dostępu lub sekretów. Zmiany zapisuj z zachowaniem aktualnego HEAD i cudzej pracy. Nie publikuj kodu donora jako własnego osiągnięcia.

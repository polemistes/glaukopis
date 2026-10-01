# Typer av elementer: det skribenten kaller dem (person, sted, kilde …), hver med en farge.

kinds-kind = Type
kinds-title = Typer av elementer
kinds-subtitle = Hva elementene i dette prosjektet kan være: så mange typer som arbeidet trenger, hver med en farge.
kinds-new = Ny type
kinds-new-ellipsis = Ny type …
kinds-change = Endre typen
kinds-manage = Typene i dette prosjektet …
kinds-none-of-them = Ingen
kinds-none = Ingen typer ennå. En type er et navn og en farge: person, sted, hendelse, kilde, argument, det arbeidet trenger.
kinds-name = Navn
kinds-name-placeholder = Person, sted, hendelse …
kinds-name-taken = Det finnes alt en type med det navnet.
kinds-colour = Farge
kinds-colour-teal = Blågrønn
kinds-colour-amber = Rav
kinds-colour-violet = Fiolett
kinds-colour-rose = Rosa
kinds-colour-green = Grønn
kinds-colour-blue = Blå
kinds-colour-rust = Rust
kinds-colour-olive = Oliven
kinds-colour-slate = Skifer
kinds-colour-plum = Plomme
kinds-template = Tekst å begynne med
kinds-template-placeholder = Utseende
    Vil
    Frykter
kinds-template-hint = Et element uten tekst som får denne typen, begynner med disse linjene, ett avsnitt hver.
kinds-create = Opprett
kinds-elements = { $count ->
    [one] { $count } element
   *[other] { $count } elementer
}
kinds-delete-title = Slette typen «{ $name }»?
kinds-delete-message = { $count ->
    [0] Ingen elementer er av den.
    [one] Det ene elementet som er av den, blir uten type.
   *[other] De { $count } elementene som er av den, blir uten type.
}

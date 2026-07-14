# cdn-fuel — Manual

Sistema de combustível com bicos e mangueira, recarga de elétricos, jerry can, sifonagem, abastecimento de aeronaves e barcos, e postos de gasolina compráveis por jogadores.

---

## Sumário

1. [Dependências](#dependências)
2. [Instalação](#instalação)
3. [Itens](#itens)
4. [Configuração](#configuração)
5. [Postos de gasolina](#postos-de-gasolina)
6. [Veículos elétricos](#veículos-elétricos)
7. [Abastecimento de aeronaves e barcos](#abastecimento-de-aeronaves-e-barcos)
8. [Jerry can e sifonagem](#jerry-can-e-sifonagem)
9. [Consumo de combustível](#consumo-de-combustível)
10. [Comandos](#comandos)
11. [Integrações](#integrações)
12. [Entrypoints para outros recursos](#entrypoints-para-outros-recursos)
13. [Localização](#localização)
14. [Estrutura de arquivos](#estrutura-de-arquivos)

---

## Dependências

| Recurso | Obrigatório | Observação |
|---|---|---|
| `qb-core` (ou `qbx-core`) | Sim | Definido em `Config.Core`. O manifesto também importa `@qb-core/shared/locale.lua` |
| `PolyZone` | Sim | Detecção das zonas dos postos e das áreas de abastecimento de aeronaves/barcos |
| `interact-sound` | Sim | Sons de bico, abastecimento e recarga |
| `ox_lib` | Sim | Importado no `fxmanifest.lua`. Menus, input, drawtext e progressbar quando `Config.Ox.*` estiverem em `true` |
| `oxmysql` | Sim | Tabela `fuel_stations` |
| `ox_target` | Sim (na config atual) | Declarado em `dependencies`. `Config.TargetResource` decide qual export de target é chamado |
| `cdn-fool` | Sim se `Config.ElectricChargerModel = true` | Os modelos `electric_charger` e `electric_nozzle` foram movidos para o recurso `cdn-fool`; as linhas `data_file` no `fxmanifest.lua` deste recurso estão comentadas |
| `qb-target` | Não | Alternativa ao `ox_target` via `Config.TargetResource` |
| `qb-menu` / `qb-input` | Não | Usados quando `Config.Ox.Menu` / `Config.Ox.Input` forem `false` |
| `ox_inventory` | Não | Metadados do jerry can e do kit de sifonagem quando `Config.Ox.Inventory = true` |
| `qb-phone` | Não | Notificação de pagamento quando `Config.RenewedPhonePayment = true` |
| `ps-dispatch` / `qb-dispatch` | Não | Alerta policial na sifonagem. Definido em `Config.SyphonDispatchSystem` |

> O `fxmanifest.lua` declara `provide 'cdn-syphoning'`. A sifonagem está embutida aqui — não rode o `cdn-syphoning` separadamente.

---

## Instalação

1. Copie a pasta `cdn-fuel` para `resources/`.
2. Mova os sons de `assets/sounds/` para `interact-sound/client/html/sounds`.
3. Importe o SQL `assets/sql/cdn-fuel.sql`. Ele cria a tabela `fuel_stations` e insere as 27 estações padrão.
4. Registre os itens `jerrycan` e `syphoningkit` no inventário (ver [Itens](#itens)) e copie as imagens de `assets/images/` para a pasta de imagens do inventário.
5. Garanta que o `cdn-fool` esteja no `server.cfg` **antes** do `cdn-fuel`, para que os modelos do carregador elétrico existam:
   ```
   ensure PolyZone
   ensure interact-sound
   ensure cdn-fool
   ensure cdn-fuel
   ```
6. Ajuste `shared/config.lua`, principalmente `Config.Core`, `Config.TargetResource` e o bloco `Config.Ox`.
7. **Conflitos** — remova qualquer outro recurso de combustível (`LegacyFuel`, `ps-fuel`, `cdn-syphoning`). Vários recursos de veículo checam combustível pelo decor `_FUEL_LEVEL`; dois sistemas escrevendo nesse decor brigam entre si.

> Aviso do autor sobre restart: reiniciar um recurso que faz stream de props pode travar clientes. Neste fork os modelos elétricos já foram separados no `cdn-fool`, então dar restart no `cdn-fuel` é seguro.

---

## Itens

| Item | Uso |
|---|---|
| `jerrycan` | Item usável e único. Armazena combustível (até `Config.JerryCanCap` litros) e permite abastecer veículos longe do posto |
| `syphoningkit` | Item usável e único. Sifona combustível de veículos, com chance de chamar a polícia |

```lua
["syphoningkit"] = {name = "syphoningkit", label = "Kit Syphoning", weight = 5000, type = "item", image = "syphoningkit.png", unique = true, useable = true, shouldClose = false, description = "Um kit feito para sifonar gasolina."},
["jerrycan"] = {name = "jerrycan", label = "Jerry Can", weight = 15000, type = "item", image = "jerrycan.png", unique = true, useable = true, shouldClose = false, description = "Um Jerry Can feito para armazenar gasolina."}
```

Com `Config.Ox.Inventory = true`, a quantidade de combustível dentro do jerry can e do kit é guardada como metadata do `ox_inventory`. Ambos são registrados como usáveis via `CreateUseableItem`.

---

## Configuração

Arquivo: `shared/config.lua`.

### Geral

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Config.Core` | string | Sim | Nome do recurso do core. `'qb-core'` ou `'qbx-core'` |
| `Config.FuelDebug` | bool | Sim | Logs de diagnóstico. **Também registra os comandos de debug** (`/setfuel`, `/getCachedFuelPrice`, `/getVehNameForBlacklist`) |
| `Config.PolyDebug` | bool | Sim | Desenha as PolyZones para conferência visual |
| `Config.ShowNearestGasStationOnly` | bool | Sim | Mostra no mapa só o posto mais próximo |
| `Config.LeaveEngineRunning` | bool | Sim | Mantém o motor ligado ao sair do veículo segurando F |
| `Config.VehicleBlowUp` | bool | Sim | Permite que o veículo exploda ao abastecer com o motor ligado |
| `Config.BlowUpChance` | número (%) | Sim | Chance da explosão acima. Padrão: `5` |
| `Config.FuelNozzleExplosion` | bool | Sim | Faz a bomba explodir se o jogador sair correndo com o bico. Autor recomenda `false` |
| `Config.FuelDecor` | string | Sim | Nome do decor que guarda o nível de combustível. **Não alterar.** Padrão: `_FUEL_LEVEL` |
| `Config.RefuelTime` | número | Sim | Multiplicador do tempo da barra de progresso por litro. Não descer abaixo de `250` |
| `Config.CostMultiplier` | número | Sim | Preço base do litro quando o posto não tem dono. Padrão: `3` |
| `Config.GlobalTax` | número (%) | Sim | Imposto cobrado na bomba. Padrão: `15.0` |
| `Config.FuelTargetExport` | bool | Sim | Só para contornar um bug do `qb-target`. **Deixe `false` com `ox_target`** |
| `Config.TargetResource` | string | Sim | `'qb-target'` ou `'ox_target'` |
| `Config.Ox.Inventory` | bool | Sim | Usa metadata do `ox_inventory` no lugar do `qb-inventory` |
| `Config.Ox.Menu` | bool | Sim | Usa menus do `ox_lib` no lugar do `qb-menu` |
| `Config.Ox.Input` | bool | Sim | Usa input dialog do `ox_lib` no lugar do `qb-input` |
| `Config.Ox.DrawText` | bool | Sim | Usa DrawText do `ox_lib` no lugar do core |
| `Config.Ox.Progress` | bool | Sim | Usa progressbar do `ox_lib` |
| `Config.WaitTime` | número (ms) | Sim | Espera após callbacks antes de abrir menus. Suba para ~300 se menus abrirem cinzas. Padrão: `400` |
| `Config.RenewedPhonePayment` | bool | Sim | Ativa o fluxo de pagamento e notificação via celular |

### Visual

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Config.PumpHose` | bool | Sim | Desenha a mangueira ligando a bomba ao bico na mão do jogador |
| `Config.RopeType.fuel` | 1-5 | Sim | Tipo de corda da mangueira de combustível. Padrão: `3` (preta grossa) |
| `Config.RopeType.electric` | 1-5 | Sim | Tipo de corda do cabo elétrico. Padrão: `4` (preta fina) |
| `Config.FaceTowardsVehicle` | bool | Sim | Vira o personagem para o tanque do veículo ao abastecer |
| `Config.StealAnimDict` / `Config.StealAnim` | string | Sim | Animação da sifonagem |
| `Config.JerryCanAnimDict` / `Config.JerryCanAnim` | string | Sim | Animação do jerry can |
| `Config.RefuelAnimationDictionary` / `Config.RefuelAnimation` | string | Sim | Animação de abastecer e de recarregar |

### Emergência

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Config.EmergencyServicesDiscount.enabled` | bool | Sim | Liga o desconto para serviços de emergência |
| `Config.EmergencyServicesDiscount.discount` | número (%) | Sim | Percentual de desconto. Padrão: `25` |
| `Config.EmergencyServicesDiscount.emergency_vehicles_only` | bool | Sim | Restringe o desconto a veículos de emergência |
| `Config.EmergencyServicesDiscount.ondutyonly` | bool | Sim | Só aplica em serviço |
| `Config.EmergencyServicesDiscount.job` | lista | Sim | Jobs elegíveis. Padrão: `police`, `sasp`, `trooper`, `ambulance` |

### Jerry can e sifonagem

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Config.UseJerryCan` | bool | Sim | Liga o jerry can |
| `Config.JerryCanCap` | número (L) | Sim | Capacidade máxima. Padrão: `50` |
| `Config.JerryCanPrice` | número | Sim | Preço de compra, sem imposto. Padrão: `200` |
| `Config.JerryCanGas` | número (L) | Sim | Litros que vêm no jerry can comprado. Não pode passar de `JerryCanCap`. Padrão: `25` |
| `Config.UseSyphoning` | bool | Sim | Liga a sifonagem. Padrão: `false` |
| `Config.SyphonDebug` | bool | Sim | Logs da sifonagem |
| `Config.SyphonKitCap` | número (L) | Sim | Capacidade do kit. Padrão: `50` |
| `Config.SyphonPoliceCallChance` | número (%) | Sim | Chance de a polícia ser avisada. Padrão: `25` |
| `Config.SyphonDispatchSystem` | string | Sim | `"ps-dispatch"`, `"qb-dispatch"`, `"qb-default"` (só blip) ou `"custom"` |

### Postos de propriedade de jogadores

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Config.PlayerOwnedGasStationsEnabled` | bool | Sim | Cria os peds de gerência e permite comprar postos |
| `Config.StationFuelSalePercentage` | número (0-1) | Sim | Fatia da venda que fica com o dono. Padrão: `0.65` |
| `Config.EmergencyShutOff` | bool | Sim | Permite ao dono desligar as bombas do posto. Padrão: `false` |
| `Config.UnlimitedFuel` | bool | Sim | Postos nunca ficam sem reserva. Útil no início da implantação |
| `Config.MaxFuelReserves` | número (L) | Sim | Teto da reserva do posto. Padrão: `100000` |
| `Config.FuelReservesPrice` | número | Sim | Preço do litro de reserva para o dono. Padrão: `2.0` |
| `Config.GasStationSellPercentage` | número (%) | Sim | Percentual do valor do posto devolvido ao vender. Padrão: `50` |
| `Config.MinimumFuelPrice` | número | Sim | Preço mínimo que o dono pode cobrar. Padrão: `2` |
| `Config.MaxFuelPrice` | número | Sim | Preço máximo que o dono pode cobrar. Padrão: `8` |
| `Config.PlayerControlledFuelPrices` | bool | Sim | Permite ao dono mudar o preço |
| `Config.GasStationNameChanges` | bool | Sim | Permite ao dono renomear o posto |
| `Config.NameChangeMinChar` / `Config.NameChangeMaxChar` | número | Sim | Limites do nome. Padrão: `10` e `25` |
| `Config.OneStationPerPerson` | bool | Sim | Impede que um jogador tenha mais de um posto |
| `Config.ProfanityList` | lista | Sim | Palavras bloqueadas no nome do posto |
| `Config.OwnersPickupFuel` | bool | Sim | Ao comprar reservas, o dono precisa buscar o combustível com um caminhão |
| `Config.PossibleDeliveryTrucks` | lista | Sim | Modelos de caminhão sorteados na entrega. Padrão: `hauler`, `phantom`, `packer` |
| `Config.DeliveryTruckSpawns` | tabela | Sim | `trailer` e `truck` (vector4 de spawn) e a `PolyZone` do depósito |

### Elétricos e consumo

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Config.ElectricVehicleCharging` | bool | Sim | Elétricos consomem "bateria" e precisam recarregar |
| `Config.ElectricChargingPrice` | número | Sim | Preço por "KW". Padrão: `4`. Esse valor **não** vai para o dono do posto |
| `Config.ElectricVehicles` | tabela | Sim | Modelos considerados elétricos, no formato `["surge"] = { isElectric = true }` |
| `Config.ElectricSprite` | número | Sim | Sprite do blip quando o jogador está em um carregador. Padrão: `620` |
| `Config.ElectricChargerModel` | bool | Sim | Spawna os props do carregador. `false` se você usa ymap ou props próprios |
| `Config.NoFuelUsage` | tabela | Sim | Veículos que não consomem combustível, no formato `["bmx"] = { blacklisted = true }` |
| `Config.Classes` | tabela | Sim | Multiplicador de consumo por classe de veículo (índices 0 a 21). `0.0` = não consome |
| `Config.FuelUsage` | tabela | Sim | Consumo por faixa de RPM. Chave = RPM (0.0 a 1.0), valor = litros/10 removidos por segundo |
| `Config.VehicleShutoffOnLowFuel.shutOffLevel` | número | Sim | Nível em que o veículo desliga sozinho. Padrão: `0` |
| `Config.VehicleShutoffOnLowFuel.sounds.enabled` | bool | Sim | Toca um som quando o veículo fica sem combustível |
| `Config.VehicleShutoffOnLowFuel.sounds.audio_bank` | string | Sim | Banco de áudio. Padrão: `DLC_PILOT_ENGINE_FAILURE_SOUNDS` |
| `Config.VehicleShutoffOnLowFuel.sounds.sound` | string | Sim | Nome do som no banco. Padrão: `Landing_Tone` |

---

## Postos de gasolina

`Config.GasStations` traz 27 postos, cada um com uma PolyZone, um ped de gerência e um ponto de carregador elétrico.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `zones` | lista de `vector2` | Sim | Polígono do posto. Inclua bombas, ped e carregador dentro dele |
| `minz` / `maxz` | número | Sim | Altura mínima e máxima da zona |
| `pumpheightadd` | número | Não | Ajuste de altura da mangueira (`Config.PumpHose`) em postos com bomba mais alta |
| `pedmodel` | string | Sim | Ped do menu de gerência. Padrão: `a_m_m_indian_01` |
| `cost` | número | Sim | Preço do posto, sem imposto. Padrão: `100000` |
| `shutoff` | bool | Sim | Estado das bombas. Deixe `false` — é gerenciado em runtime |
| `pedcoords` | tabela `{x, y, z, h}` | Sim | Posição e heading do ped |
| `electriccharger` | nil | Sim | Deixe `nil`. É preenchido em runtime com a entidade do prop |
| `electricchargercoords` | `vector4` | Sim | Onde o carregador elétrico é spawnado |
| `label` | string | Sim | Nome padrão do posto, antes de o dono renomear |

O estado persistente de cada posto (dono, reserva, preço, saldo e nome) vive na tabela `fuel_stations`, indexada pelo mesmo índice numérico do `Config.GasStations` — se você adicionar um posto novo no config, precisa inserir a linha correspondente na tabela.

### O que o dono pode fazer

Falando com o ped do posto que possui: comprar reservas de combustível, definir o preço do litro (limitado por `MinimumFuelPrice` e `MaxFuelPrice`), sacar e depositar no caixa do posto, renomear o posto (filtrado pela `ProfanityList`), desligar as bombas (se `Config.EmergencyShutOff`) e vender o posto de volta por `GasStationSellPercentage` do valor.

Com `Config.OwnersPickupFuel = true`, a reserva comprada não cai direto: o dono recebe um caminhão em `Config.DeliveryTruckSpawns` e precisa levá-lo até a PolyZone de entrega para que os litros entrem no posto.

---

## Veículos elétricos

Com `Config.ElectricVehicleCharging = true`, os modelos listados em `Config.ElectricVehicles` consomem bateria em vez de combustível e só podem ser recarregados nos carregadores elétricos — spawnados em `electricchargercoords` de cada posto, usando os modelos `electric_charger` e `electric_nozzle` que vêm do recurso `cdn-fool`.

A recarga é cobrada por "KW" (`Config.ElectricChargingPrice`), com o mesmo desconto de emergência do combustível. Diferente da gasolina, o valor da recarga **não** é repassado ao dono do posto.

---

## Abastecimento de aeronaves e barcos

`Config.AirAndWaterVehicleFueling` define 18 áreas ativas (helipontos de MRPD, Pillbox, Central LS Medical, Zancudo, Paleto PD, Sandy, aeroporto, Merryweather, Devin Weston, entre outras) e docas para embarcações.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `PolyZone.coords` | lista de `vector2` | Sim | Polígono da área |
| `PolyZone.minmax.min` / `.max` | número | Sim | Altura mínima e máxima |
| `draw_text` | string | Sim | Texto de interação exibido na área |
| `type` | string | Sim | `'air'` ou `'water'` |
| `whitelist.enabled` | bool | Sim | Restringe o uso a determinados jobs |
| `whitelist.on_duty_only` | bool | Sim | Exige estar em serviço |
| `whitelist.whitelisted_jobs` | lista | Sim | Jobs liberados |
| `prop.model` | string | Sim | Modelo da bomba. Padrão: `prop_gas_pump_1d` |
| `prop.coords` | `vector4` | Sim | Posição e heading da bomba |

Opções globais da seção: `refuel_button` (controle de interação, padrão `47` = tecla G), `nozzle_length` (distância máxima do bico até a bomba antes de ele voltar, padrão `20.0`), `air_fuel_price` (padrão `10`/litro) e `water_fuel_price` (padrão `4`/litro). O desconto de emergência também vale aqui.

---

## Jerry can e sifonagem

**Jerry can** — comprado na bomba por `Config.JerryCanPrice` (mais imposto), já vem com `Config.JerryCanGas` litros. Usar o item abre o menu para abastecer um veículo próximo ou reabastecer o próprio galão numa bomba, até `Config.JerryCanCap`.

**Sifonagem** — desligada por padrão (`Config.UseSyphoning = false`). Com o `syphoningkit`, o jogador drena combustível de um veículo para o kit (até `Config.SyphonKitCap`). Cada tentativa tem `Config.SyphonPoliceCallChance`% de disparar um alerta no sistema de dispatch escolhido em `Config.SyphonDispatchSystem`.

---

## Consumo de combustível

O consumo por segundo é lido de `Config.FuelUsage` pela faixa de RPM atual e multiplicado pelo fator da classe do veículo em `Config.Classes`. Veículos listados em `Config.NoFuelUsage` e classes com fator `0.0` (por padrão, Cycles) não consomem nada.

O nível fica no decor `_FUEL_LEVEL` da entidade. Veículos que aparecem sem o decor recebem um nível aleatório entre 20 e 80 litros.

Com `Config.VehicleShutoffOnLowFuel`, o motor desliga sozinho ao atingir `shutOffLevel` e, se `sounds.enabled`, toca o alerta configurado.

---

## Comandos

Todos os comandos só existem quando `Config.FuelDebug = true`.

| Comando | Permissão | Descrição |
|---|---|---|
| `/setfuel <litros>` | Todos (só com debug ligado) | Define o combustível do veículo mais próximo |
| `/getCachedFuelPrice` | Todos (só com debug ligado) | Imprime no console o preço de combustível em cache |
| `/getVehNameForBlacklist` | Todos (só com debug ligado) | Imprime o nome do modelo do veículo atual, pronto para colar em `Config.NoFuelUsage` |

> Estes comandos não têm gate de permissão no código — eles simplesmente não são registrados com `Config.FuelDebug = false`. Não deixe o debug ligado em produção.

---

## Integrações

### ox_lib / ox_inventory / ox_target

Controlados pelo bloco `Config.Ox` e por `Config.TargetResource`. Com `Config.Ox.Inventory = true`, o combustível dentro do jerry can e do kit de sifonagem é guardado como metadata do item, em vez de depender do `qb-inventory`.

### qb-target

Alternativa ao `ox_target`. Se você sofre com o bug em que a opção de abastecer aparece fora do posto, instale o export `AllowRefuel` no `qb-target` e ligue `Config.FuelTargetExport`. Com `ox_target`, esse campo **precisa** ficar em `false`, senão o recurso chama um export que não existe e gera erro.

### cdn-fool

Fornece os modelos `electric_charger` e `electric_nozzle`. Necessário sempre que `Config.ElectricChargerModel = true`. Precisa ser iniciado antes do `cdn-fuel`.

### qb-phone

Com `Config.RenewedPhonePayment = true`, o pagamento no débito vira uma notificação no celular (`exports['qb-phone']:PhoneNotification`), em vez de sair direto da conta.

### ps-dispatch / qb-dispatch

Alertam a polícia quando alguém é pego sifonando. O sistema é escolhido em `Config.SyphonDispatchSystem`; a opção `"qb-default"` só cria um blip, e `"custom"` exige que você implemente a chamada no `client/fuel_cl.lua`.

---

## Entrypoints para outros recursos

O recurso exporta duas funções, **do lado cliente** (declaradas em `exports { 'GetFuel', 'SetFuel' }` no `fxmanifest.lua`, implementadas em `client/utils.lua`).

```lua
-- Lê o nível de combustível do veículo (decor _FUEL_LEVEL).
local fuel = exports['cdn-fuel']:GetFuel(vehicle)

-- Define o nível de combustível do veículo.
exports['cdn-fuel']:SetFuel(vehicle, 100.0)
```

Uso típico — impedir dar partida sem combustível:

```lua
if exports['cdn-fuel']:GetFuel(veh) ~= 0 then
    SetVehicleEngineOn(veh, true, false, true)
else
    QBCore.Functions.Notify('Sem combustível..', 'error')
end
```

---

## Localização

Os textos usam o sistema de locale do `qb-core` (`Lang:t(...)`), não o do `ox_lib`. O idioma é escolhido **descomentando a linha correspondente** em `shared_scripts` no `fxmanifest.lua` — não há convar:

```lua
shared_scripts {
    'shared/config.lua',
    '@qb-core/shared/locale.lua',
    '@ox_lib/init.lua',
    'locales/pt-br.lua', -- ativo
    -- 'locales/en.lua',
    -- 'locales/de.lua',
    -- 'locales/fr.lua',
    -- 'locales/es.lua',
    -- 'locales/ee.lua',
}
```

Idiomas disponíveis em `locales/`: `pt-br` (ativo neste fork), `en`, `de`, `fr`, `es`, `ee`.

---

## Estrutura de arquivos

```
cdn-fuel/
├── client/
│   ├── fuel_cl.lua        — bicos, mangueira, abastecimento, jerry can, sifonagem, zonas de ar/água, comandos de debug
│   ├── electric_cl.lua    — carregadores elétricos, cabo e menus de recarga
│   ├── station_cl.lua     — menus do ped: comprar, gerenciar, precificar, sacar/depositar, entregar reservas
│   └── utils.lua          — GetFuel/SetFuel, imposto, blips, checagem de blacklist
├── server/
│   ├── fuel_sv.lua        — cobrança, itens usáveis (jerrycan, syphoningkit), dispatch da sifonagem
│   ├── station_sv.lua     — CRUD da tabela fuel_stations: dono, reservas, saldo, preço, nome
│   └── electric_sv.lua    — cobrança da recarga elétrica
├── shared/
│   └── config.lua         — toda a configuração: postos, elétricos, zonas de ar/água, consumo, profanity list
├── locales/
│   ├── pt-br.lua          — ativo no fxmanifest
│   ├── en.lua
│   ├── de.lua
│   ├── es.lua
│   ├── fr.lua
│   └── ee.lua
├── assets/
│   ├── sql/cdn-fuel.sql   — tabela fuel_stations + 27 estações padrão
│   ├── sounds/            — mover para interact-sound/client/html/sounds
│   └── images/            — imagens de jerrycan e syphoningkit para o inventário
├── version                — 2.1.9
└── fxmanifest.lua         — deps, exports GetFuel/SetFuel, provide 'cdn-syphoning'
```

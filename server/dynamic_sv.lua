local QBCore = exports[Config.Core]:GetCoreObject()

-- Helper to save dynamic stations to JSON
local function SaveDynamicStations()
    local dynamicStations = {}
    -- Assuming dynamic stations are appended after the static ones or we filter them.
    -- Better approach: We only save what's in the JSON + new ones.
    -- However, Config.GasStations is a mix now. We should keep track of dynamic ones separately or iterating.
    -- Simplest for now: We will just append the new one to the file content.
end

-- Helper to load
function LoadDynamicStations()
    local loadFile = LoadResourceFile(GetCurrentResourceName(), "data/locations.json")
    if loadFile then
        local dynamicStations = json.decode(loadFile)
        if dynamicStations and type(dynamicStations) == "table" then
            local count = 0
            for _, station in ipairs(dynamicStations) do
                -- Find the next available ID
                local newId = #Config.GasStations + 1
                
                -- Ensure vector2/vector3 conversion if needed (JSON doesn't support them)
                if station.zones then
                    for i, zone in ipairs(station.zones) do
                        if type(zone) == "table" and zone.x and zone.y then
                            station.zones[i] = vector2(zone.x, zone.y)
                        end
                    end
                end
                
                if station.pedcoords and type(station.pedcoords) == "table" then
                    station.pedcoords = vector4(station.pedcoords.x, station.pedcoords.y, station.pedcoords.z, station.pedcoords.w)
                end

                if station.electricchargercoords and type(station.electricchargercoords) == "table" then
                    station.electricchargercoords = vector4(station.electricchargercoords.x, station.electricchargercoords.y, station.electricchargercoords.z, station.electricchargercoords.w)
                end
                
                -- Insert into Config
                Config.GasStations[newId] = station
                count = count + 1
            end
            print("^2[CDN-FUEL] Loaded " .. count .. " dynamic gas stations.^7")
        end
    else
        SaveResourceFile(GetCurrentResourceName(), "data/locations.json", "[]", -1)
        print("^3[CDN-FUEL] Created new locations.json file.^7")
    end
end

RegisterNetEvent('cdn-fuel:server:createStation', function(data)
    local src = source
    local Player = QBCore.Functions.GetPlayer(src)
    if not Player or (not QBCore.Functions.HasPermission(src, 'admin') and not QBCore.Functions.HasPermission(src, 'god')) then
        return
    end

    local newId = #Config.GasStations + 1
    
    -- Construct station data
    local newStation = {
        label = data.label,
        cost = tonumber(data.cost) or 100000,
        zones = data.zones, -- Expecting table of {x=, y=} from client
        pedcoords = data.pedcoords, -- Expecting {x=, y=, z=, w=}
        electricchargercoords = data.electricchargercoords, -- Expecting {x=, y=, z=, w=} or nil
        minz = data.minz,
        maxz = data.maxz,
        pumpheightadd = 2.1, -- Default
        shutoff = data.shutoff or false,
        type = data.type or 'car' -- Default to car
    }

    -- 1. Update Memory
    -- Convert client data to vectors for memory usage
    -- 1. Update Memory
    local memStation = {
        label = newStation.label,
        cost = newStation.cost,
        zones = {},
        pedcoords = vector4(newStation.pedcoords.x, newStation.pedcoords.y, newStation.pedcoords.z, newStation.pedcoords.w),
        minz = newStation.minz,
        maxz = newStation.maxz,
        pumpheightadd = 2.1,
        shutoff = newStation.shutoff,
        shutoff = newStation.shutoff,
        pedmodel = data.pedmodel, -- Store pedmodel in config
        type = newStation.type,
        electricchargercoords = nil
    }
    if newStation.electricchargercoords then
        memStation.electricchargercoords = vector4(newStation.electricchargercoords.x, newStation.electricchargercoords.y, newStation.electricchargercoords.z, newStation.electricchargercoords.w)
    end
    
    memStation.fuelpumpcoords = {}
    if data.fuelpumpcoords then
        for _, p in ipairs(data.fuelpumpcoords) do
            table.insert(memStation.fuelpumpcoords, vector4(p.x, p.y, p.z, p.w))
        end
    end

    for _, z in ipairs(newStation.zones) do
        table.insert(memStation.zones, vector2(z.x, z.y))
    end
    
    Config.GasStations[newId] = memStation

    -- 2. Insert into Database (Full Data)
    local zonesJson = json.encode(newStation.zones)
    local pedCoordsJson = json.encode(newStation.pedcoords)
    local elecCoordsJson = json.encode(newStation.electricchargercoords) -- Will be "null" if nil
    local fuelPumpCoordsJson = json.encode(data.fuelpumpcoords) -- New column
    local type = newStation.type

    MySQL.Async.execute('INSERT INTO fuel_stations (location, label, cost, fuel, fuelprice, balance, zones, minz, maxz, pedmodel, pedcoords, shutoff, pumpheightadd, electricchargercoords, fuelpumpcoords, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        {
            newId, 
            newStation.label, 
            newStation.cost, 
            100000, 
            3, 
            0,
            zonesJson,
            newStation.minz,
            newStation.maxz,
            data.pedmodel or "a_m_m_indian_01", -- Use provided model or default
            pedCoordsJson,
            newStation.shutoff,
            2.1,
            elecCoordsJson,
            fuelPumpCoordsJson,
            type
        }, function(rows)
            if rows > 0 then
                TriggerClientEvent('QBCore:Notify', src, 'Posto criado com sucesso! ID: ' .. newId, 'success')
                -- 3. Sync with Clients
                TriggerClientEvent('cdn-fuel:client:syncStations', -1, newId, memStation)
            else
                TriggerClientEvent('QBCore:Notify', src, 'Erro ao criar posto no banco de dados.', 'error')
            end
    end)
end)

RegisterNetEvent('cdn-fuel:server:requestDynamicStations', function()
    local src = source
    -- Send ALL loaded stations to the client
    -- Since Config.GasStations is now fully populated from DB on startup
    
    for id, station in pairs(Config.GasStations) do
        TriggerClientEvent('cdn-fuel:client:syncStations', src, id, station)
    end
end)

-- DATABASE MIGRATION & LOADING LOGIC --

local function LoadStationsFromDB()
    MySQL.Async.fetchAll('SELECT * FROM fuel_stations', {}, function(stations)
        if stations then
            local count = 0
            for _, dbStation in ipairs(stations) do
                local id = tonumber(dbStation.location)
                
                -- Parse JSON fields
                local zones = dbStation.zones and json.decode(dbStation.zones) or {}
                local convertedZones = {}
                for _, z in ipairs(zones) do
                    table.insert(convertedZones, vector2(z.x, z.y))
                end

                local pedcoords = dbStation.pedcoords and json.decode(dbStation.pedcoords)
                local pedVec = pedcoords and vector4(pedcoords.x, pedcoords.y, pedcoords.z, pedcoords.w) or nil

                local elecCoords = dbStation.electricchargercoords and json.decode(dbStation.electricchargercoords)
                local elecVec = elecCoords and vector4(elecCoords.x, elecCoords.y, elecCoords.z, elecCoords.w) or nil

                local pumpCoords = dbStation.fuelpumpcoords and json.decode(dbStation.fuelpumpcoords) or {}
                local pumpVecs = {}
                for _, p in ipairs(pumpCoords) do
                    table.insert(pumpVecs, vector4(p.x, p.y, p.z, p.w))
                end

                -- Update Config
                Config.GasStations[id] = {
                    label = dbStation.label,
                    cost = tonumber(dbStation.cost),
                    zones = convertedZones,
                    pedcoords = pedVec,
                    minz = tonumber(dbStation.minz),
                    maxz = tonumber(dbStation.maxz),
                    pedmodel = dbStation.pedmodel, -- Load customized ped model
                    pumpheightadd = tonumber(dbStation.pumpheightadd) or 2.1,
                    shutoff = dbStation.shutoff == 1 or dbStation.shutoff == true, -- Handle MySQL boolean/tinyint
                    shutoff = dbStation.shutoff == 1 or dbStation.shutoff == true, -- Handle MySQL boolean/tinyint
                    electricchargercoords = elecVec,
                    fuelpumpcoords = pumpVecs,
                    logo = dbStation.logo, -- Load Logo URL
                    type = dbStation.type or 'car' -- Load Type
                }
                count = count + 1
            end
            print("^2[CDN-FUEL] Loaded " .. count .. " gas stations from DATABASE.^7")
            
            -- Force Sync to all clients after load (Fixes first-run race condition)
            for id, station in pairs(Config.GasStations) do
                TriggerClientEvent('cdn-fuel:client:syncStations', -1, id, station)
            end
        end
    end)
end

-- Replace the original LoadDynamicStations with DB Loader
function LoadDynamicStations()
    LoadStationsFromDB()
end

RegisterCommand('migrate_json_to_sql', function(source, args, rawCommand)
    if source ~= 0 then return end -- Console only
    
    local loadFile = LoadResourceFile(GetCurrentResourceName(), "data/locations.json")
    if not loadFile then print("No locations.json found.") return end
    
    local jsonStations = json.decode(loadFile)
    if not jsonStations then print("Failed to decode locations.json.") return end

    print("Migrating " .. #jsonStations .. " stations to SQL...")

    local count = 0
    local total = #jsonStations

    for i, station in ipairs(jsonStations) do
        local id = i -- Assuming ID matches index for migration
        
        -- Prepare data for SQL
        local zonesJson = json.encode(station.zones)
        local pedCoordsJson = json.encode(station.pedcoords)
        local elecCoordsJson = station.electricchargercoords and json.encode(station.electricchargercoords) or nil
        
        local query = [[
            INSERT INTO fuel_stations (location, label, cost, fuel, fuelprice, balance, zones, minz, maxz, pedmodel, pedcoords, shutoff, pumpheightadd, electricchargercoords)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            zones = VALUES(zones),
            minz = VALUES(minz),
            maxz = VALUES(maxz),
            pedmodel = VALUES(pedmodel),
            pedcoords = VALUES(pedcoords),
            shutoff = VALUES(shutoff),
            pumpheightadd = VALUES(pumpheightadd),
            electricchargercoords = VALUES(electricchargercoords),
            label = VALUES(label),
            cost = VALUES(cost)
        ]]
        
        MySQL.Async.execute(query, {
            id,
            station.label,
            station.cost or 100000,
            100000, 
            3,      
            0,      
            zonesJson,
            station.minz,
            station.maxz,
            station.pedmodel or "a_m_m_indian_01",
            pedCoordsJson,
            station.shutoff,
            station.pumpheightadd or 2.1,
            elecCoordsJson
        }, function()
            count = count + 1
            if count == total then
                print("^2[CDN-FUEL] Migração finalizada! " .. count .. " postos salvos no banco de dados.^7")
            end
        end)
    end
end, false)

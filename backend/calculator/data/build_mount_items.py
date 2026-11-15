import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_CATALOG = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..', '..', 'frontend', 'src', 'data', 'craftableItems.json'))
BACKEND_CATALOG = os.path.abspath(os.path.join(SCRIPT_DIR, 'generated_catalog.json'))

MOUNT_ITEMS = [
    # 1. Battle Mounts (Energy Manipulator)
    {
        "id": "mount_flame_basilisk",
        "name": "Flame Basilisk",
        "category": "mounts",
        "subcategory": "battle_mounts",
        "template": "T7_MOUNT_SWAMPDRAGON_BATTLE",
        "minTier": 7,
        "maxTier": 7,
        "allowEnchantment": False,
        "primaryMatName": "Saddled Swamp Dragon",
        "primaryQty": 1,
        "primaryMatIcon": "T7_MOUNT_SWAMPDRAGON",
        "secondaryMatName": "Opulent Cloth",
        "secondaryQty": 20,
        "secondaryMatIcon": "T7_CLOTH",
        "bonusCity": None,
        "isArtifact": True,
        "artifactType": "Siphoned Energy",
        "artifactName": "Siphoned Energy",
        "artifactTemplate": "UNIQUE_GVGTOKEN_GENERIC",
        "artifactQty": 5000,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 2000.0,
        "baseFocus": 0
    },
    {
        "id": "mount_venom_basilisk",
        "name": "Venom Basilisk",
        "category": "mounts",
        "subcategory": "battle_mounts",
        "template": "T7_MOUNT_ARMORED_SWAMPDRAGON_BATTLE",
        "minTier": 7,
        "maxTier": 7,
        "allowEnchantment": False,
        "primaryMatName": "Saddled Swamp Dragon",
        "primaryQty": 1,
        "primaryMatIcon": "T7_MOUNT_SWAMPDRAGON",
        "secondaryMatName": "Meteorite Steel Bar",
        "secondaryQty": 20,
        "secondaryMatIcon": "T7_METALBAR",
        "bonusCity": None,
        "isArtifact": True,
        "artifactType": "Siphoned Energy",
        "artifactName": "Siphoned Energy",
        "artifactTemplate": "UNIQUE_GVGTOKEN_GENERIC",
        "artifactQty": 5000,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 2000.0,
        "baseFocus": 0
    },
    {
        "id": "mount_avalon_basilisk",
        "name": "Avalonian Basilisk",
        "category": "mounts",
        "subcategory": "battle_mounts",
        "template": "T7_MOUNT_SWAMPDRAGON_AVALON_BASILISK",
        "minTier": 7,
        "maxTier": 7,
        "allowEnchantment": False,
        "primaryMatName": "Saddled Swamp Dragon",
        "primaryQty": 1,
        "primaryMatIcon": "T7_MOUNT_SWAMPDRAGON",
        "secondaryMatName": None,
        "secondaryQty": 0,
        "secondaryMatIcon": None,
        "bonusCity": None,
        "isArtifact": True,
        "artifactType": "Avalonian Shard",
        "artifactName": "Avalonian Shards",
        "artifactTemplate": "QUESTITEM_TOKEN_AVALON",
        "artifactQty": 5000,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 2000.0,
        "baseFocus": 0
    },
    {
        "id": "mount_siege_ballista",
        "name": "Siege Ballista",
        "category": "mounts",
        "subcategory": "battle_mounts",
        "template": "T6_MOUNT_SIEGE_BALLISTA",
        "minTier": 6,
        "maxTier": 6,
        "allowEnchantment": False,
        "primaryMatName": "Transport Ox (T6)",
        "primaryQty": 1,
        "primaryMatIcon": "T6_MOUNT_OX",
        "primaryNoReturn": True,
        "secondaryMatName": "Runite Steel Bar",
        "secondaryQty": 20,
        "secondaryMatIcon": "T6_METALBAR",
        "secondaryNoReturn": True,
        "bonusCity": None,
        "isArtifact": True,
        "artifactType": "Siphoned Energy",
        "artifactName": "Siphoned Energy",
        "artifactTemplate": "UNIQUE_GVGTOKEN_GENERIC",
        "artifactQty": 500,
        "artifactNoReturn": True,
        "extraMaterials": [
            {
                "id": "leather",
                "name": "Hardened Leather",
                "template": "T6_LEATHER",
                "qty": 20,
                "isRefinedResource": True,
                "noReturn": True
            },
            {
                "id": "planks",
                "name": "Bloodoak Planks",
                "template": "T6_PLANKS",
                "qty": 20,
                "isRefinedResource": True,
                "noReturn": True
            }
        ],
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 1500.0,
        "baseFocus": 0
    },
    {
        "id": "mount_command_mammoth",
        "name": "Elder's Command Mammoth",
        "category": "mounts",
        "subcategory": "battle_mounts",
        "template": "T8_MOUNT_MAMMOTH_BATTLE",
        "minTier": 8,
        "maxTier": 8,
        "allowEnchantment": False,
        "primaryMatName": "Elder's Transport Mammoth",
        "primaryQty": 1,
        "primaryMatIcon": "T8_MOUNT_MAMMOTH_TRANSPORT",
        "secondaryMatName": "Fortified Leather",
        "secondaryQty": 20,
        "secondaryMatIcon": "T8_LEATHER",
        "bonusCity": None,
        "isArtifact": True,
        "artifactType": "Siphoned Energy",
        "artifactName": "Siphoned Energy",
        "artifactTemplate": "UNIQUE_GVGTOKEN_GENERIC",
        "artifactQty": 10000,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 50000.0,
        "baseFocus": 0
    },
    # 2. World Boss Artifact Mounts (Saddler)
    {
        "id": "mount_spectral_bonehorse",
        "name": "Spectral Bonehorse",
        "category": "mounts",
        "subcategory": "world_boss",
        "template": "T8_MOUNT_HORSE_UNDEAD",
        "minTier": 8,
        "maxTier": 8,
        "allowEnchantment": False,
        "primaryMatName": "Elder's Riding Horse",
        "primaryQty": 1,
        "primaryMatIcon": "T8_MOUNT_HORSE",
        "secondaryMatName": None,
        "secondaryQty": 0,
        "secondaryMatIcon": None,
        "bonusCity": None,
        "isArtifact": True,
        "artifactType": "World Boss Artifact",
        "artifactName": "Spectral Mask",
        "artifactTemplate": "T8_MOUNTUPGRADE_HORSE_CURSE",
        "artifactQty": 1,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 10000.0,
        "baseFocus": 0
    },
    {
        "id": "mount_rageclaw",
        "name": "Rageclaw",
        "category": "mounts",
        "subcategory": "world_boss",
        "template": "T8_MOUNT_COUGAR_KEEPER",
        "minTier": 8,
        "maxTier": 8,
        "allowEnchantment": False,
        "primaryMatName": "Swiftclaw (T5)",
        "primaryQty": 1,
        "primaryMatIcon": "T5_MOUNT_COUGAR_KEEPER",
        "secondaryMatName": None,
        "secondaryQty": 0,
        "secondaryMatIcon": None,
        "bonusCity": None,
        "isArtifact": True,
        "artifactType": "World Boss Artifact",
        "artifactName": "Sacred Bone Marrow",
        "artifactTemplate": "T8_MOUNTUPGRADE_COUGAR_KEEPER",
        "artifactQty": 1,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 8000.0,
        "baseFocus": 0
    },
    {
        "id": "mount_morgana_nightmare",
        "name": "Morgana Nightmare",
        "category": "mounts",
        "subcategory": "world_boss",
        "template": "T8_MOUNT_ARMORED_HORSE_MORGANA",
        "minTier": 8,
        "maxTier": 8,
        "allowEnchantment": False,
        "primaryMatName": "Elder's Armored Horse",
        "primaryQty": 1,
        "primaryMatIcon": "T8_MOUNT_ARMORED_HORSE",
        "secondaryMatName": None,
        "secondaryQty": 0,
        "secondaryMatIcon": None,
        "bonusCity": None,
        "isArtifact": True,
        "artifactType": "World Boss Artifact",
        "artifactName": "Infernal Horseshoes",
        "artifactTemplate": "T8_MOUNTUPGRADE_HORSE_MORGANA",
        "artifactQty": 1,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 12000.0,
        "baseFocus": 0
    },
    # 3. Armored Warhorses (Saddler)
    {
        "id": "mount_armored_horse",
        "name": "Armored Horse",
        "category": "mounts",
        "subcategory": "armored_horses",
        "template": "T{tier}_MOUNT_ARMORED_HORSE",
        "minTier": 5,
        "maxTier": 8,
        "allowEnchantment": False,
        "primaryMatName": "Grown Horse",
        "primaryQty": 1,
        "primaryMatIcon": "T{tier}_FARM_HORSE_GROWN",
        "primaryNoReturn": True,
        "secondaryMatName": "Metal Bars",
        "secondaryQty": 20,
        "secondaryMatIcon": "T{tier}_METALBAR",
        "bonusCity": None,
        "isArtifact": False,
        "artifactType": None,
        "extraMaterials": [
            {
                "id": "cloth",
                "name": "Cloth",
                "template": "T{tier}_CLOTH",
                "qty": 10,
                "isRefinedResource": True,
                "noReturn": False
            }
        ],
        "isNoReturn": False,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 1200.0,
        "baseFocus": 0
    },
    # 4. Standard Saddled Mounts (Saddler)
    {
        "id": "mount_riding_horse",
        "name": "Riding Horse",
        "category": "mounts",
        "subcategory": "standard_mounts",
        "template": "T{tier}_MOUNT_HORSE",
        "minTier": 3,
        "maxTier": 8,
        "allowEnchantment": False,
        "primaryMatName": "Grown Horse",
        "primaryQty": 1,
        "primaryMatIcon": "T{tier}_FARM_HORSE_GROWN",
        "secondaryMatName": "Leather",
        "secondaryQty": 20,
        "secondaryMatIcon": "T{tier}_LEATHER",
        "bonusCity": None,
        "isArtifact": False,
        "artifactType": None,
        "artifactName": None,
        "artifactTemplate": None,
        "artifactQty": 0,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 500.0,
        "baseFocus": 0
    },
    {
        "id": "mount_transport_ox",
        "name": "Transport Ox",
        "category": "mounts",
        "subcategory": "standard_mounts",
        "template": "T{tier}_MOUNT_OX",
        "minTier": 3,
        "maxTier": 8,
        "allowEnchantment": False,
        "primaryMatName": "Grown Ox",
        "primaryQty": 1,
        "primaryMatIcon": "T{tier}_FARM_OX_GROWN",
        "secondaryMatName": "Planks",
        "secondaryQty": 30,
        "secondaryMatIcon": "T{tier}_PLANKS",
        "bonusCity": None,
        "isArtifact": False,
        "artifactType": None,
        "artifactName": None,
        "artifactTemplate": None,
        "artifactQty": 0,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 600.0,
        "baseFocus": 0
    },
    {
        "id": "mount_giant_stag",
        "name": "Giant Stag",
        "category": "mounts",
        "subcategory": "standard_mounts",
        "template": "T4_MOUNT_GIANTSTAG",
        "minTier": 4,
        "maxTier": 4,
        "allowEnchantment": False,
        "primaryMatName": "Tame Giant Stag",
        "primaryQty": 1,
        "primaryMatIcon": "T4_FARM_GIANTSTAG_GROWN",
        "secondaryMatName": "Cured Leather (T4)",
        "secondaryQty": 20,
        "secondaryMatIcon": "T4_LEATHER",
        "bonusCity": None,
        "isArtifact": False,
        "artifactType": None,
        "artifactName": None,
        "artifactTemplate": None,
        "artifactQty": 0,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 800.0,
        "baseFocus": 0
    },
    {
        "id": "mount_direwolf",
        "name": "Direwolf",
        "category": "mounts",
        "subcategory": "standard_mounts",
        "template": "T6_MOUNT_DIREWOLF",
        "minTier": 6,
        "maxTier": 6,
        "allowEnchantment": False,
        "primaryMatName": "Tame Direwolf",
        "primaryQty": 1,
        "primaryMatIcon": "T6_FARM_DIREWOLF_GROWN",
        "secondaryMatName": "Hardened Leather (T6)",
        "secondaryQty": 20,
        "secondaryMatIcon": "T6_LEATHER",
        "bonusCity": None,
        "isArtifact": False,
        "artifactType": None,
        "artifactName": None,
        "artifactTemplate": None,
        "artifactQty": 0,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 2500.0,
        "baseFocus": 0
    },
    {
        "id": "mount_moose",
        "name": "Moose",
        "category": "mounts",
        "subcategory": "standard_mounts",
        "template": "T6_MOUNT_GIANTSTAG_MOOSE",
        "minTier": 6,
        "maxTier": 6,
        "allowEnchantment": False,
        "primaryMatName": "Tame Moose",
        "primaryQty": 1,
        "primaryMatIcon": "T6_FARM_GIANTSTAG_MOOSE_GROWN",
        "secondaryMatName": "Hardened Leather (T6)",
        "secondaryQty": 20,
        "secondaryMatIcon": "T6_LEATHER",
        "bonusCity": None,
        "isArtifact": False,
        "artifactType": None,
        "artifactName": None,
        "artifactTemplate": None,
        "artifactQty": 0,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 3000.0,
        "baseFocus": 0
    },
    {
        "id": "mount_direboar",
        "name": "Direboar",
        "category": "mounts",
        "subcategory": "standard_mounts",
        "template": "T7_MOUNT_DIREBOAR",
        "minTier": 7,
        "maxTier": 7,
        "allowEnchantment": False,
        "primaryMatName": "Tame Direboar",
        "primaryQty": 1,
        "primaryMatIcon": "T7_FARM_DIREBOAR_GROWN",
        "secondaryMatName": "Reinforced Leather (T7)",
        "secondaryQty": 20,
        "secondaryMatIcon": "T7_LEATHER",
        "bonusCity": None,
        "isArtifact": False,
        "artifactType": None,
        "artifactName": None,
        "artifactTemplate": None,
        "artifactQty": 0,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 5000.0,
        "baseFocus": 0
    },
    {
        "id": "mount_swampdragon",
        "name": "Swamp Dragon",
        "category": "mounts",
        "subcategory": "standard_mounts",
        "template": "T7_MOUNT_SWAMPDRAGON",
        "minTier": 7,
        "maxTier": 7,
        "allowEnchantment": False,
        "primaryMatName": "Tame Swamp Dragon",
        "primaryQty": 1,
        "primaryMatIcon": "T7_FARM_SWAMPDRAGON_GROWN",
        "secondaryMatName": "Reinforced Leather (T7)",
        "secondaryQty": 20,
        "secondaryMatIcon": "T7_LEATHER",
        "bonusCity": None,
        "isArtifact": False,
        "artifactType": None,
        "artifactName": None,
        "artifactTemplate": None,
        "artifactQty": 0,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 6000.0,
        "baseFocus": 0
    },
    {
        "id": "mount_direbear",
        "name": "Direbear",
        "category": "mounts",
        "subcategory": "standard_mounts",
        "template": "T8_MOUNT_DIREBEAR",
        "minTier": 8,
        "maxTier": 8,
        "allowEnchantment": False,
        "primaryMatName": "Tame Direbear",
        "primaryQty": 1,
        "primaryMatIcon": "T8_FARM_DIREBEAR_GROWN",
        "secondaryMatName": "Fortified Leather (T8)",
        "secondaryQty": 20,
        "secondaryMatIcon": "T8_LEATHER",
        "bonusCity": None,
        "isArtifact": False,
        "artifactType": None,
        "artifactName": None,
        "artifactTemplate": None,
        "artifactQty": 0,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 12000.0,
        "baseFocus": 0
    },
    {
        "id": "mount_mammoth_transport",
        "name": "Elder's Transport Mammoth",
        "category": "mounts",
        "subcategory": "standard_mounts",
        "template": "T8_MOUNT_MAMMOTH_TRANSPORT",
        "minTier": 8,
        "maxTier": 8,
        "allowEnchantment": False,
        "primaryMatName": "Tame Mammoth",
        "primaryQty": 1,
        "primaryMatIcon": "T8_FARM_MAMMOTH_GROWN",
        "secondaryMatName": "Fortified Leather (T8)",
        "secondaryQty": 20,
        "secondaryMatIcon": "T8_LEATHER",
        "bonusCity": None,
        "isArtifact": False,
        "artifactType": None,
        "artifactName": None,
        "artifactTemplate": None,
        "artifactQty": 0,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 50000.0,
        "baseFocus": 0
    },
    # 5. Faction Warfare Mounts (Saddler)
    {
        "id": "mount_fw_bear_t5",
        "name": "Saddled Winter Bear (T5)",
        "category": "mounts",
        "subcategory": "faction_mounts",
        "template": "T5_MOUNT_DIREBEAR_FW_FORTSTERLING",
        "minTier": 5,
        "maxTier": 5,
        "allowEnchantment": False,
        "primaryMatName": "Tame Winter Bear",
        "primaryQty": 1,
        "primaryMatIcon": "T5_FARM_DIREBEAR_FW_FORTSTERLING_GROWN",
        "secondaryMatName": "Refined Leather (T5)",
        "secondaryQty": 20,
        "secondaryMatIcon": "T5_LEATHER",
        "bonusCity": "Fort Sterling",
        "isArtifact": True,
        "artifactType": "Faction Crest",
        "artifactName": "Fort Sterling Mountain Heart",
        "artifactTemplate": "T1_FACTION_MOUNTAIN_TOKEN_1",
        "artifactQty": 5,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 2000.0,
        "baseFocus": 0
    },
    {
        "id": "mount_fw_bear_t8",
        "name": "Elite Winter Bear (T8)",
        "category": "mounts",
        "subcategory": "faction_mounts",
        "template": "T8_MOUNT_DIREBEAR_FW_FORTSTERLING_ELITE",
        "minTier": 8,
        "maxTier": 8,
        "allowEnchantment": False,
        "primaryMatName": "Tame Elite Winter Bear",
        "primaryQty": 1,
        "primaryMatIcon": "T8_FARM_DIREBEAR_FW_FORTSTERLING_GROWN",
        "secondaryMatName": "Fortified Leather (T8)",
        "secondaryQty": 20,
        "secondaryMatIcon": "T8_LEATHER",
        "bonusCity": "Fort Sterling",
        "isArtifact": True,
        "artifactType": "Faction Crest",
        "artifactName": "Fort Sterling Mountain Heart",
        "artifactTemplate": "T1_FACTION_MOUNTAIN_TOKEN_1",
        "artifactQty": 20,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 15000.0,
        "baseFocus": 0
    },
    {
        "id": "mount_fw_boar_t5",
        "name": "Saddled Wild Boar (T5)",
        "category": "mounts",
        "subcategory": "faction_mounts",
        "template": "T5_MOUNT_DIREBOAR_FW_LYMHURST",
        "minTier": 5,
        "maxTier": 5,
        "allowEnchantment": False,
        "primaryMatName": "Tame Wild Boar",
        "primaryQty": 1,
        "primaryMatIcon": "T5_FARM_DIREBOAR_FW_LYMHURST_GROWN",
        "secondaryMatName": "Refined Leather (T5)",
        "secondaryQty": 20,
        "secondaryMatIcon": "T5_LEATHER",
        "bonusCity": "Lymhurst",
        "isArtifact": True,
        "artifactType": "Faction Crest",
        "artifactName": "Lymhurst Treeheart",
        "artifactTemplate": "T1_FACTION_FOREST_TOKEN_1",
        "artifactQty": 5,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 2000.0,
        "baseFocus": 0
    },
    {
        "id": "mount_fw_boar_t8",
        "name": "Elite Wild Boar (T8)",
        "category": "mounts",
        "subcategory": "faction_mounts",
        "template": "T8_MOUNT_DIREBOAR_FW_LYMHURST_ELITE",
        "minTier": 8,
        "maxTier": 8,
        "allowEnchantment": False,
        "primaryMatName": "Tame Elite Wild Boar",
        "primaryQty": 1,
        "primaryMatIcon": "T8_FARM_DIREBOAR_FW_LYMHURST_GROWN",
        "secondaryMatName": "Fortified Leather (T8)",
        "secondaryQty": 20,
        "secondaryMatIcon": "T8_LEATHER",
        "bonusCity": "Lymhurst",
        "isArtifact": True,
        "artifactType": "Faction Crest",
        "artifactName": "Lymhurst Treeheart",
        "artifactTemplate": "T1_FACTION_FOREST_TOKEN_1",
        "artifactQty": 20,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 15000.0,
        "baseFocus": 0
    },
    {
        "id": "mount_fw_ram_t5",
        "name": "Saddled Bighorn Ram (T5)",
        "category": "mounts",
        "subcategory": "faction_mounts",
        "template": "T5_MOUNT_RAM_FW_MARTLOCK",
        "minTier": 5,
        "maxTier": 5,
        "allowEnchantment": False,
        "primaryMatName": "Tame Bighorn Ram",
        "primaryQty": 1,
        "primaryMatIcon": "T5_FARM_RAM_FW_MARTLOCK_GROWN",
        "secondaryMatName": "Refined Leather (T5)",
        "secondaryQty": 20,
        "secondaryMatIcon": "T5_LEATHER",
        "bonusCity": "Martlock",
        "isArtifact": True,
        "artifactType": "Faction Crest",
        "artifactName": "Martlock Rockheart",
        "artifactTemplate": "T1_FACTION_HIGHLAND_TOKEN_1",
        "artifactQty": 5,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 2000.0,
        "baseFocus": 0
    },
    {
        "id": "mount_fw_ram_t8",
        "name": "Elite Bighorn Ram (T8)",
        "category": "mounts",
        "subcategory": "faction_mounts",
        "template": "T8_MOUNT_RAM_FW_MARTLOCK_ELITE",
        "minTier": 8,
        "maxTier": 8,
        "allowEnchantment": False,
        "primaryMatName": "Tame Elite Bighorn Ram",
        "primaryQty": 1,
        "primaryMatIcon": "T8_FARM_RAM_FW_MARTLOCK_GROWN",
        "secondaryMatName": "Fortified Leather (T8)",
        "secondaryQty": 20,
        "secondaryMatIcon": "T8_LEATHER",
        "bonusCity": "Martlock",
        "isArtifact": True,
        "artifactType": "Faction Crest",
        "artifactName": "Martlock Rockheart",
        "artifactTemplate": "T1_FACTION_HIGHLAND_TOKEN_1",
        "artifactQty": 20,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 15000.0,
        "baseFocus": 0
    },
    {
        "id": "mount_fw_moabird_t5",
        "name": "Saddled Moabird (T5)",
        "category": "mounts",
        "subcategory": "faction_mounts",
        "template": "T5_MOUNT_MOABIRD_FW_BRIDGEWATCH",
        "minTier": 5,
        "maxTier": 5,
        "allowEnchantment": False,
        "primaryMatName": "Tame Moabird",
        "primaryQty": 1,
        "primaryMatIcon": "T5_FARM_MOABIRD_FW_BRIDGEWATCH_GROWN",
        "secondaryMatName": "Refined Leather (T5)",
        "secondaryQty": 20,
        "secondaryMatIcon": "T5_LEATHER",
        "bonusCity": "Bridgewatch",
        "isArtifact": True,
        "artifactType": "Faction Crest",
        "artifactName": "Bridgewatch Beastheart",
        "artifactTemplate": "T1_FACTION_STEPPE_TOKEN_1",
        "artifactQty": 5,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 2000.0,
        "baseFocus": 0
    },
    {
        "id": "mount_fw_moabird_t8",
        "name": "Elite Moabird (T8)",
        "category": "mounts",
        "subcategory": "faction_mounts",
        "template": "T8_MOUNT_MOABIRD_FW_BRIDGEWATCH_ELITE",
        "minTier": 8,
        "maxTier": 8,
        "allowEnchantment": False,
        "primaryMatName": "Tame Elite Moabird",
        "primaryQty": 1,
        "primaryMatIcon": "T8_FARM_MOABIRD_FW_BRIDGEWATCH_GROWN",
        "secondaryMatName": "Fortified Leather (T8)",
        "secondaryQty": 20,
        "secondaryMatIcon": "T8_LEATHER",
        "bonusCity": "Bridgewatch",
        "isArtifact": True,
        "artifactType": "Faction Crest",
        "artifactName": "Bridgewatch Beastheart",
        "artifactTemplate": "T1_FACTION_STEPPE_TOKEN_1",
        "artifactQty": 20,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 15000.0,
        "baseFocus": 0
    },
    {
        "id": "mount_fw_salamander_t5",
        "name": "Saddled Swamp Salamander (T5)",
        "category": "mounts",
        "subcategory": "faction_mounts",
        "template": "T5_MOUNT_SWAMPDRAGON_FW_THETFORD",
        "minTier": 5,
        "maxTier": 5,
        "allowEnchantment": False,
        "primaryMatName": "Tame Swamp Salamander",
        "primaryQty": 1,
        "primaryMatIcon": "T5_FARM_SWAMPDRAGON_FW_THETFORD_GROWN",
        "secondaryMatName": "Refined Leather (T5)",
        "secondaryQty": 20,
        "secondaryMatIcon": "T5_LEATHER",
        "bonusCity": "Thetford",
        "isArtifact": True,
        "artifactType": "Faction Crest",
        "artifactName": "Thetford Vineheart",
        "artifactTemplate": "T1_FACTION_SWAMP_TOKEN_1",
        "artifactQty": 5,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 2000.0,
        "baseFocus": 0
    },
    {
        "id": "mount_fw_salamander_t8",
        "name": "Elite Swamp Salamander (T8)",
        "category": "mounts",
        "subcategory": "faction_mounts",
        "template": "T8_MOUNT_SWAMPDRAGON_FW_THETFORD_ELITE",
        "minTier": 8,
        "maxTier": 8,
        "allowEnchantment": False,
        "primaryMatName": "Tame Elite Swamp Salamander",
        "primaryQty": 1,
        "primaryMatIcon": "T8_FARM_SWAMPDRAGON_FW_THETFORD_GROWN",
        "secondaryMatName": "Fortified Leather (T8)",
        "secondaryQty": 20,
        "secondaryMatIcon": "T8_LEATHER",
        "bonusCity": "Thetford",
        "isArtifact": True,
        "artifactType": "Faction Crest",
        "artifactName": "Thetford Vineheart",
        "artifactTemplate": "T1_FACTION_SWAMP_TOKEN_1",
        "artifactQty": 20,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 15000.0,
        "baseFocus": 0
    },
    {
        "id": "mount_fw_greywolf_t5",
        "name": "Saddled Greywolf (T5)",
        "category": "mounts",
        "subcategory": "faction_mounts",
        "template": "T5_MOUNT_GREYWOLF_FW_CAERLEON",
        "minTier": 5,
        "maxTier": 5,
        "allowEnchantment": False,
        "primaryMatName": "Tame Greywolf",
        "primaryQty": 1,
        "primaryMatIcon": "T5_FARM_GREYWOLF_FW_CAERLEON_GROWN",
        "secondaryMatName": "Refined Leather (T5)",
        "secondaryQty": 20,
        "secondaryMatIcon": "T5_LEATHER",
        "bonusCity": "Caerleon",
        "isArtifact": True,
        "artifactType": "Faction Crest",
        "artifactName": "Caerleon Shadowheart",
        "artifactTemplate": "T1_FACTION_CAERLEON_TOKEN_1",
        "artifactQty": 5,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 2000.0,
        "baseFocus": 0
    },
    {
        "id": "mount_fw_greywolf_t8",
        "name": "Elite Greywolf (T8)",
        "category": "mounts",
        "subcategory": "faction_mounts",
        "template": "T8_MOUNT_GREYWOLF_FW_CAERLEON_ELITE",
        "minTier": 8,
        "maxTier": 8,
        "allowEnchantment": False,
        "primaryMatName": "Tame Elite Greywolf",
        "primaryQty": 1,
        "primaryMatIcon": "T8_FARM_GREYWOLF_FW_CAERLEON_GROWN",
        "secondaryMatName": "Fortified Leather (T8)",
        "secondaryQty": 20,
        "secondaryMatIcon": "T8_LEATHER",
        "bonusCity": "Caerleon",
        "isArtifact": True,
        "artifactType": "Faction Crest",
        "artifactName": "Caerleon Shadowheart",
        "artifactTemplate": "T1_FACTION_CAERLEON_TOKEN_1",
        "artifactQty": 20,
        "isNoReturn": True,
        "journalName": None,
        "journalTemplate": None,
        "famePerUnit": 0,
        "baseItemValue": 15000.0,
        "baseFocus": 0
    }
]

def enrich_mounts_from_items_json(items):
    items_path = os.path.join(SCRIPT_DIR, 'items.json')
    if not os.path.exists(items_path):
        return items

    with open(items_path, 'r', encoding='utf-8') as f:
        raw = json.load(f)

    items_node = raw.get('items', {})
    by_uid = {}
    for lst in items_node.values():
        if isinstance(lst, list):
            for obj in lst:
                if isinstance(obj, dict) and obj.get('@uniquename') and obj['@uniquename'] not in by_uid:
                    by_uid[obj['@uniquename']] = obj
        elif isinstance(lst, dict) and lst.get('@uniquename') and lst['@uniquename'] not in by_uid:
            by_uid[lst['@uniquename']] = lst

    for m in items:
        tmpl = m.get('template', '')
        lo = int(m.get('minTier', 3))
        hi = int(m.get('maxTier', 8))
        focus_by_tier = {}
        max_fame_factor = 1.0
        primary_no_return = False
        secondary_no_return = False
        artifact_no_return = False

        sample_uid = tmpl.replace('{tier}', str(lo))
        for t in range(lo, hi + 1):
            uid = tmpl.replace('{tier}', str(t))
            obj = by_uid.get(uid)
            if not obj:
                continue
            ff = obj.get('@destinyandjournalcraftfamefactor')
            if ff:
                max_fame_factor = max(max_fame_factor, float(ff))
            req = obj.get('craftingrequirements')
            if isinstance(req, list):
                req = req[0]
            if isinstance(req, dict):
                cf = req.get('@craftingfocus')
                if cf is not None:
                    focus_by_tier[str(t)] = round(float(cf))

        # Check material returnability on the lowest tier recipe from items.json
        sample_obj = by_uid.get(sample_uid, {})
        sample_req = sample_obj.get('craftingrequirements')
        if isinstance(sample_req, list):
            sample_req = sample_req[0]
        res_list = sample_req.get('craftresource', []) if isinstance(sample_req, dict) else []
        if isinstance(res_list, dict):
            res_list = [res_list]

        res_map = {r.get('@uniquename', ''): (r.get('@maxreturnamount') == '0') for r in res_list}

        def _is_noret(tmpl_str):
            if not tmpl_str:
                return False
            resolved = tmpl_str.replace('{tier}', str(lo))
            return res_map.get(resolved, False)

        is_battle_mount = m.get('subcategory') == 'battle_mounts'
        prim_noret = True if is_battle_mount else _is_noret(m.get('primaryMatIcon'))
        sec_qty = int(m.get('secondaryQty') or 0)
        sec_noret = True if is_battle_mount else (_is_noret(m.get('secondaryMatIcon')) if sec_qty > 0 else True)
        art_qty = int(m.get('artifactQty') or 0)
        art_noret = True if is_battle_mount else (_is_noret(m.get('artifactTemplate')) if (m.get('isArtifact') and art_qty > 0) else True)

        extras = m.get('extraMaterials') or []
        for ex in extras:
            if is_battle_mount:
                ex['noReturn'] = True
            elif 'noReturn' not in ex:
                ex['noReturn'] = _is_noret(ex.get('template'))

        # Wait: In Albion Online, single animal upgrades (e.g. spectral bonehorse / rageclaw / morgana nightmare / avalon basilisk)
        # have NO refundable refined leather/planks/bars/cloth; grown animals & faction tokens have @maxreturnamount="0".
        # Battle mounts (Energy Manipulator NPC) likewise have 0% RRR and 0 station usage fee.
        has_refundable_extra = any(not ex.get('noReturn', False) for ex in extras)
        has_refundable_mat = (not is_battle_mount) and (
            (not prim_noret)
            or (sec_qty > 0 and not sec_noret)
            or (m.get('isArtifact') and art_qty > 0 and not art_noret)
            or has_refundable_extra
        )
        # For Avalon Basilisk, T7_MOUNT_SWAMPDRAGON is the primary animal mount (not refunded in game, treat primary mount as non-returnable if secondaryQty == 0)
        if 'SWAMPDRAGON_AVALON_BASILISK' in tmpl:
            prim_noret = True
            has_refundable_mat = False

        m['primaryNoReturn'] = prim_noret
        m['secondaryNoReturn'] = sec_noret if sec_qty > 0 else False
        m['artifactNoReturn'] = art_noret if (m.get('isArtifact') and art_qty > 0) else True
        m['isNoReturn'] = not has_refundable_mat
        m['focusByTier'] = focus_by_tier
        m['baseFocus'] = focus_by_tier.get(str(lo), 0)
        m['destinyFactor'] = round(max_fame_factor, 2)
    return items


def merge_catalog(path):
    enriched_mounts = enrich_mounts_from_items_json(MOUNT_ITEMS)
    with open(path, 'r', encoding='utf-8') as f:
        existing = json.load(f)
    
    # Strip any previous mount category items if re-running
    cleaned = [i for i in existing if i.get('category') != 'mounts']
    cleaned.extend(enriched_mounts)
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(cleaned, f, indent=2)
    print(f"Updated {path}: total items = {len(cleaned)}")

merge_catalog(FRONTEND_CATALOG)
merge_catalog(BACKEND_CATALOG)

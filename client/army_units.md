{
  "documents": [
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/adept",
      "fields": {
        "keywords": {
          "stringValue": ""
        },
        "large": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "0"
              },
              "models": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              }
            }
          }
        },
        "small": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "1"
              },
              "models": {
                "integerValue": "4"
              },
              "cost": {
                "integerValue": "150"
              }
            }
          }
        },
        "faction": {
          "stringValue": "Protoss"
        },
        "id": {
          "stringValue": "adept"
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "1 - 2"
                    },
                    "tier": {
                      "integerValue": "1"
                    },
                    "supply": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "supply": {
                      "integerValue": "1"
                    },
                    "tier": {
                      "integerValue": "2"
                    },
                    "modelCount": {
                      "stringValue": "3 - 4"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "tier": {
                      "integerValue": "3"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "modelCount": {
                      "stringValue": "-"
                    }
                  }
                }
              }
            ]
          }
        },
        "unitType": {
          "stringValue": "Core"
        },
        "name": {
          "stringValue": "Adept"
        },
        "combatRange": {
          "stringValue": "3"
        },
        "tags": {
          "stringValue": "Biological, Light, Ground"
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "All Weapons of Friendly Units targeting an Enemy Unit Within 4\" of this Unit’s Shade token gain PRECISION (1)."
                    },
                    "name": {
                      "stringValue": "Psionic Presence"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Psionic Energy)"
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "name": {
                      "stringValue": "Psionic Transfer"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Set a Shade token Wholly Within 12\" of any model in this Unit. At the End of the Round, the controlling player may set all models of this Unit in Coherency, treating the Shade token as the Leading Model. The Shade token has DISPLACEMENT."
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": ""
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "description": {
                      "stringValue": "RANGE: 8 | TARGET: All | RoA: 2 | HIT: 3+ | DMG: 1\nSURGE: Light (D3+1)\n\nANTI-EVADE (1)"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "name": {
                      "stringValue": "Glaive Cannon"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "name": {
                      "stringValue": "Resonating Glaives"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit's Glaive Cannon gains BUFF RoA (1)."
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "20"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Psionic Energy)"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit's Glaive Cannon Ranged weapon gains ANTI-EVADE (2)."
                    },
                    "name": {
                      "stringValue": "Guidance"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "10"
                    },
                    "costL": {
                      "integerValue": "10"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "name": {
                      "stringValue": "Glaive Strike"
                    },
                    "linkedTo": {
                      "stringValue": "Strike"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 1 | HIT: 4+ | DMG: 1\nSURGE: Light (D3)\n\nPIERCE Light (2)"
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "20"
                    },
                    "activation": {
                      "stringValue": ""
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 1 | HIT: 4+ | DMG: 1\nSURGE: -"
                    },
                    "name": {
                      "stringValue": "Strike"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              }
            ]
          }
        },
        "stats": {
          "mapValue": {
            "fields": {
              "armor": {
                "stringValue": "5+"
              },
              "hp": {
                "stringValue": "3"
              },
              "size": {
                "stringValue": "2"
              },
              "shield": {
                "stringValue": "2"
              },
              "evade": {
                "stringValue": "5+"
              },
              "speed": {
                "stringValue": "5/8"
              }
            }
          }
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:23:54.477693Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/artanis",
      "fields": {
        "unitType": {
          "stringValue": "Hero"
        },
        "name": {
          "stringValue": "Artanis"
        },
        "combatRange": {
          "stringValue": "1"
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "description": {
                      "stringValue": "Treat this Unit’s Supply characteristic as increased by 1 for Controlling and Contesting Mission Markers, completing objectives, and resolving Disengage checks."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Commander"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "name": {
                      "stringValue": "Phase Prism"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When Artanis is nominated to deploy from Reserves, it may resolve the PLACE (0) effect from another Friendly Unit. That Friendly Unit is removed from the battlefield and returned to Reserves. Artanis' Activation ends."
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cReaction\u003e\n(1 Psionic Energy)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "description": {
                      "stringValue": "When another Friendly Unit Within 8\" is declared as the target of a Ranged Attack and this Unit is a valid target, redirect the attack to this Unit. This Unit is eligible to make an Evade Roll against the redirected attack. This Special Ability remains active until the End of the current Activation."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Hierarch’s Stand"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cReaction\u003e\n(1 Psionic Energy)"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Lightning Dash"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "After this Unit resolves a successful Charge action, it may declare a second Charge action against a different Enemy Unit, ignoring the restriction on Charging while Engaged. The Devastating Charge ability does not trigger a second time."
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Devastating Charge"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Immediately after this Unit completes a successful Charge, resolve the IMPACT (6) 4+ effect."
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Twilight Blades Strike"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 2 | HIT: 2+ | DMG: 3\nSURGE: Armoured (D3)"
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "name": {
                      "stringValue": "Twilight Blades Sweep"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 6 | HIT: 2+ | DMG: 1\nSURGE: Light (D3+1)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    }
                  }
                }
              }
            ]
          }
        },
        "tags": {
          "stringValue": "Biological, Psionic, Ground, Unique"
        },
        "stats": {
          "mapValue": {
            "fields": {
              "evade": {
                "stringValue": "5+"
              },
              "speed": {
                "stringValue": "7"
              },
              "armor": {
                "stringValue": "4+"
              },
              "hp": {
                "stringValue": "8"
              },
              "size": {
                "stringValue": "2"
              },
              "shield": {
                "stringValue": "4"
              }
            }
          }
        },
        "keywords": {
          "stringValue": ""
        },
        "large": {
          "mapValue": {
            "fields": {
              "models": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              },
              "supply": {
                "integerValue": "0"
              }
            }
          }
        },
        "id": {
          "stringValue": "artanis"
        },
        "faction": {
          "stringValue": "Protoss"
        },
        "small": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "1"
              },
              "cost": {
                "integerValue": "250"
              },
              "models": {
                "integerValue": "1"
              }
            }
          }
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "-"
                    },
                    "tier": {
                      "integerValue": "1"
                    },
                    "supply": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "1 - 1"
                    },
                    "supply": {
                      "integerValue": "1"
                    },
                    "tier": {
                      "integerValue": "2"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "-"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "3"
                    }
                  }
                }
              }
            ]
          }
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-09T17:51:49.738778Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/corpser__roach_",
      "fields": {
        "keywords": {
          "stringValue": ""
        },
        "small": {
          "mapValue": {
            "fields": {
              "models": {
                "integerValue": "3"
              },
              "cost": {
                "integerValue": "250"
              },
              "supply": {
                "integerValue": "1"
              }
            }
          }
        },
        "faction": {
          "stringValue": "Zerg"
        },
        "id": {
          "stringValue": "corpser__roach_"
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "1 - 1"
                    },
                    "tier": {
                      "integerValue": "1"
                    },
                    "supply": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "tier": {
                      "integerValue": "2"
                    },
                    "supply": {
                      "integerValue": "1"
                    },
                    "modelCount": {
                      "stringValue": "2 - 3"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "-"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "3"
                    }
                  }
                }
              }
            ]
          }
        },
        "large": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              },
              "models": {
                "integerValue": "0"
              }
            }
          }
        },
        "combatRange": {
          "stringValue": "1"
        },
        "unitType": {
          "stringValue": "Core"
        },
        "name": {
          "stringValue": "Corpser (Roach)"
        },
        "stats": {
          "mapValue": {
            "fields": {
              "speed": {
                "stringValue": "4/7"
              },
              "evade": {
                "stringValue": "5+"
              },
              "size": {
                "stringValue": "2"
              },
              "shield": {
                "stringValue": "-"
              },
              "armor": {
                "stringValue": "3+"
              },
              "hp": {
                "stringValue": "4"
              }
            }
          }
        },
        "tags": {
          "stringValue": "Armoured, Biological, Ground"
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(2 Biomass)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "description": {
                      "stringValue": "If this Unit is Unengaged, it gains or loses the Burrowed Status."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Burrow"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "name": {
                      "stringValue": "Tunneling Claws"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "While this Unit has the Burrowed Status, it may perform the Move and Run actions without losing that Status. It may also move through other Units’ bases."
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "costS": {
                      "integerValue": "10"
                    },
                    "costL": {
                      "integerValue": "10"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(2 Biomass)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "description": {
                      "stringValue": "Once per Game. Resolve the SUMMON (Roachling) effect."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Roachling Infestation"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "20"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "name": {
                      "stringValue": "Burrow Ambush"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit is nominated to deploy from the Reserves, it may resolve the PLACE (18) effect from the controlling player's Entry Edge. No model may be set Within 10\" of any Enemy model. This Unit's Activation ends."
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Biomass)"
                    },
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "20"
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit gains BUFF SPEED (1), or BUFF SPEED (2) if the Unit is ON CREEP."
                    },
                    "name": {
                      "stringValue": "Glial Reconstitution"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": ""
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "description": {
                      "stringValue": "RANGE: 8 | TARGET: Ground | RoA: 2 | HIT: 3+ | DMG: 1\nSURGE: -"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "name": {
                      "stringValue": "Acid Saliva"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Regeneration"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit becomes Activated, if it has the Burrowed Status, resolve the HEAL (2) effect."
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "name": {
                      "stringValue": "Hydriodic Bile"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit's Acid Saliva weapon gains Surge Type: Light, and S Dice: D3+1."
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "costS": {
                      "integerValue": "10"
                    },
                    "costL": {
                      "integerValue": "10"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "description": {
                      "stringValue": "Immediately after this Unit completes a successful Charge, resolve the IMPACT (3) 4+ effect."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Devastating Charge"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": ""
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 3 | HIT: 4+ | DMG: 1\nSURGE: Light (D3+1)"
                    },
                    "name": {
                      "stringValue": "Claws"
                    }
                  }
                }
              }
            ]
          }
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:23:54.477693Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/goliath",
      "fields": {
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "name": {
                      "stringValue": "Ares-Class Targeting System"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit’s Autocannon and Underbelly Machine Gun weapons gain PRECISION (1)."
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "20"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Command Point)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "description": {
                      "stringValue": "Select one Enemy Unit Within 12\". Whenever a Friendly Goliath Unit targets that enemy with an Autocannon, that weapon gains Surge Type: Light, Armoured, and S Dice: D3+1."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Target Lock"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Indomitable"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "While Engaged, this Unit may target and be targeted by Unengaged Enemy Units. In both cases, the defending Unit gains an Evade Roll against those attacks."
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Autocannon"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: 12 | TARGET: Ground | RoA: 9 | HIT: 4+ | DMG: 1\nSURGE: -\n\nLONG RANGE (18\")"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Underbelly Machine Gun"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: 8 | TARGET: Ground | RoA: 6 | HIT: 3+ | DMG: 1\nSURGE: Light (D3)\n\nPINPOINT, SIDEARM"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": ""
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: 16 | TARGET: Flying | RoA: 6 | HIT: 3+ | DMG: 1\nSURGE: Light (D3)\n\nANTI-EVADE (1), SIDEARM"
                    },
                    "name": {
                      "stringValue": "Hellfire Missiles"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Scatter Missiles"
                    },
                    "linkedTo": {
                      "stringValue": "Hellfire Missiles"
                    },
                    "description": {
                      "stringValue": "RANGE: 18 | TARGET: Ground | RoA: 6 | HIT: 5+ | DMG: 1\nSURGE: Light (D3)\n\nINDIRECT FIRE, LOCKED IN (6), LONG RANGE (24\"), SIDEARM"
                    },
                    "costS": {
                      "integerValue": "30"
                    },
                    "costL": {
                      "integerValue": "30"
                    },
                    "activation": {
                      "stringValue": ""
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": ""
                    },
                    "costS": {
                      "integerValue": "40"
                    },
                    "costL": {
                      "integerValue": "40"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "linkedTo": {
                      "stringValue": "Hellfire Missiles"
                    },
                    "description": {
                      "stringValue": "RANGE: 12 | TARGET: Ground | RoA: 3 | HIT: 3+ | DMG: 1\nSURGE: Armoured (D3)\n\nPIERCE Armoured (3), SIDEARM"
                    },
                    "name": {
                      "stringValue": "Haywire Missiles"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "name": {
                      "stringValue": "Devastating Charge"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Immediately after this Unit completes a successful Charge, resolve the IMPACT (4) 3+ effect."
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 4 | HIT: 5+ | DMG: 1\nSURGE: -"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "name": {
                      "stringValue": "Stomp"
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              }
            ]
          }
        },
        "tags": {
          "stringValue": "Armoured, Mechanical, Ground"
        },
        "stats": {
          "mapValue": {
            "fields": {
              "evade": {
                "stringValue": "-"
              },
              "speed": {
                "stringValue": "7"
              },
              "hp": {
                "stringValue": "10"
              },
              "armor": {
                "stringValue": "4+"
              },
              "shield": {
                "stringValue": "-"
              },
              "size": {
                "stringValue": "3"
              }
            }
          }
        },
        "unitType": {
          "stringValue": "Elite"
        },
        "name": {
          "stringValue": "Goliath"
        },
        "combatRange": {
          "stringValue": "5"
        },
        "large": {
          "mapValue": {
            "fields": {
              "models": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              },
              "supply": {
                "integerValue": "0"
              }
            }
          }
        },
        "id": {
          "stringValue": "goliath"
        },
        "faction": {
          "stringValue": "Terran"
        },
        "small": {
          "mapValue": {
            "fields": {
              "models": {
                "integerValue": "1"
              },
              "cost": {
                "integerValue": "190"
              },
              "supply": {
                "integerValue": "2"
              }
            }
          }
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "tier": {
                      "integerValue": "1"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "modelCount": {
                      "stringValue": "-"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "1 - 1"
                    },
                    "supply": {
                      "integerValue": "2"
                    },
                    "tier": {
                      "integerValue": "2"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "3"
                    },
                    "modelCount": {
                      "stringValue": "-"
                    }
                  }
                }
              }
            ]
          }
        },
        "keywords": {
          "stringValue": ""
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:23:54.477693Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/hydralisk",
      "fields": {
        "large": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "3"
              },
              "models": {
                "integerValue": "4"
              },
              "cost": {
                "integerValue": "260"
              }
            }
          }
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "1 - 1"
                    },
                    "tier": {
                      "integerValue": "1"
                    },
                    "supply": {
                      "integerValue": "1"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "supply": {
                      "integerValue": "2"
                    },
                    "tier": {
                      "integerValue": "2"
                    },
                    "modelCount": {
                      "stringValue": "2 - 2"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "supply": {
                      "integerValue": "3"
                    },
                    "tier": {
                      "integerValue": "3"
                    },
                    "modelCount": {
                      "stringValue": "3 - 4"
                    }
                  }
                }
              }
            ]
          }
        },
        "id": {
          "stringValue": "hydralisk"
        },
        "faction": {
          "stringValue": "Zerg"
        },
        "small": {
          "mapValue": {
            "fields": {
              "models": {
                "integerValue": "2"
              },
              "cost": {
                "integerValue": "140"
              },
              "supply": {
                "integerValue": "2"
              }
            }
          }
        },
        "keywords": {
          "stringValue": ""
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "description": {
                      "stringValue": "This Unit’s Horizontal Coherency is 4\"."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Squadron"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "name": {
                      "stringValue": "Ancillary Carapace"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit gains TOUGH (1) on the first Armour Roll of each Activation."
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "40"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "If this Unit has Stationary Status, it is eligible to make an Evade Roll against the first Ranged Attack targeting it this Round. If this Unit is ON CREEP, it gains +1 Modifier to this Evade Roll."
                    },
                    "name": {
                      "stringValue": "Lurking"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "10"
                    },
                    "costL": {
                      "integerValue": "20"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "40"
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit is nominated to deploy from the Reserves, it may resolve the PLACE (18) effect from the controlling player's Entry Edge. No model may be set Within 10\" of any Enemy model. This Unit's Activation ends."
                    },
                    "name": {
                      "stringValue": "Burrow Ambush"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Needle Spines"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: 12 | TARGET: All | RoA: 3 | HIT: 3+ | DMG: 2\nSURGE: Light, Armoured (D3+1)"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cReaction\u003e\n(1 Biomass)"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Lunge"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When another Friendly Unit Within 10\" is the target of a Ranged Attack, after the attack is fully resolved, this Unit, if Unengaged, may perform a Move action Directly Towards the attacking Unit."
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "40"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "description": {
                      "stringValue": "This Unit's Needle Spines ranged weapon gains LONG RANGE (16\")."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Grooved Spines"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 2 | HIT: 4+ | DMG: 1\nSURGE: -"
                    },
                    "name": {
                      "stringValue": "Scythe"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              }
            ]
          }
        },
        "tags": {
          "stringValue": "Biological, Light, Ground"
        },
        "stats": {
          "mapValue": {
            "fields": {
              "shield": {
                "stringValue": "-"
              },
              "size": {
                "stringValue": "2"
              },
              "hp": {
                "stringValue": "4"
              },
              "armor": {
                "stringValue": "5+"
              },
              "speed": {
                "stringValue": "4/8"
              },
              "evade": {
                "stringValue": "5+"
              }
            }
          }
        },
        "unitType": {
          "stringValue": "Elite"
        },
        "name": {
          "stringValue": "Hydralisk"
        },
        "combatRange": {
          "stringValue": "5"
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:23:54.477693Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/jim_raynor",
      "fields": {
        "keywords": {
          "stringValue": ""
        },
        "large": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "0"
              },
              "models": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              }
            }
          }
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "-"
                    },
                    "tier": {
                      "integerValue": "1"
                    },
                    "supply": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "tier": {
                      "integerValue": "2"
                    },
                    "supply": {
                      "integerValue": "1"
                    },
                    "modelCount": {
                      "stringValue": "1 - 1"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "tier": {
                      "integerValue": "3"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "modelCount": {
                      "stringValue": "-"
                    }
                  }
                }
              }
            ]
          }
        },
        "id": {
          "stringValue": "jim_raynor"
        },
        "faction": {
          "stringValue": "Terran"
        },
        "small": {
          "mapValue": {
            "fields": {
              "cost": {
                "integerValue": "230"
              },
              "models": {
                "integerValue": "1"
              },
              "supply": {
                "integerValue": "1"
              }
            }
          }
        },
        "name": {
          "stringValue": "Jim Raynor"
        },
        "unitType": {
          "stringValue": "Hero"
        },
        "combatRange": {
          "stringValue": "4"
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Treat this Unit’s Supply characteristic as increased by 1 for Controlling and Contesting Mission Markers, completing objectives, and resolving Disengage checks."
                    },
                    "name": {
                      "stringValue": "Commander"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "The Supply Value of all Friendly Units Within 8\" of this Unit cannot be reduced below 1 for Contesting Mission Markers and completing objectives."
                    },
                    "name": {
                      "stringValue": "Freedom Fighters"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "name": {
                      "stringValue": "Orders"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "REPEATABLE. Select another Friendly Biological Unit Within 8\", spend CP and apply one of the following effects:\n\n1 CP: That Unit’s first used weapon gains the CRITICAL HIT (2).\n\n1 CP: That Unit ignores the Disengage penalty for the remainder of the Round.\n\n2 CP: Remove the Activation Marker from that Unit."
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(X Command Point)"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Commando Rifle"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: 18 | TARGET: All | RoA: 3 | HIT: 3+ | DMG: 1\nSURGE: Armoured (D3)\n\nBULKY, PIERCE Armoured (3)"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "C-14 rifle"
                    },
                    "linkedTo": {
                      "stringValue": "Commando Rifle"
                    },
                    "description": {
                      "stringValue": "RANGE: 12 | TARGET: All | RoA: 6 | HIT: 3+ | DMG: 1\nSURGE: Light (D3+1)\n\nBURST FIRE 8\" (3)"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "“Justice” Revolver"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: 6 | TARGET: Ground | RoA: 2 | HIT: 3+ | DMG: 2\nSURGE: -\n\nANTI-EVADE (2), SIDEARM, PINPOINT"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": ""
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 2 | HIT: 4+ | DMG: 1\nSURGE: Light (D3)"
                    },
                    "name": {
                      "stringValue": "Bayonet"
                    }
                  }
                }
              }
            ]
          }
        },
        "tags": {
          "stringValue": "Biological, Ground, Unique"
        },
        "stats": {
          "mapValue": {
            "fields": {
              "speed": {
                "stringValue": "7"
              },
              "evade": {
                "stringValue": "5+"
              },
              "shield": {
                "stringValue": "-"
              },
              "size": {
                "stringValue": "2"
              },
              "hp": {
                "stringValue": "8"
              },
              "armor": {
                "stringValue": "4+"
              }
            }
          }
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:23:54.477693Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/kerrigan",
      "fields": {
        "combatRange": {
          "stringValue": "2"
        },
        "name": {
          "stringValue": "Kerrigan"
        },
        "unitType": {
          "stringValue": "Hero"
        },
        "stats": {
          "mapValue": {
            "fields": {
              "size": {
                "stringValue": "2"
              },
              "shield": {
                "stringValue": "-"
              },
              "armor": {
                "stringValue": "5+"
              },
              "hp": {
                "stringValue": "9"
              },
              "speed": {
                "stringValue": "7"
              },
              "evade": {
                "stringValue": "6+"
              }
            }
          }
        },
        "tags": {
          "stringValue": "Biological, Psionic, Ground, Unique"
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "description": {
                      "stringValue": "Treat this Unit’s Supply characteristic as increased by 1 for Controlling and Contesting Mission Markers, completing objectives, and resolving Disengage checks."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Commander"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Biomass)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Select one Enemy Unit Within 12\". That Unit counts as Activated in this Phase (set an Activation Marker next to it)."
                    },
                    "name": {
                      "stringValue": "Crushing Grip"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "name": {
                      "stringValue": "Mutating Carapace"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Select one Enemy Unit Within 18\". This Unit is eligible to make an Evade Roll against all attacks made by the selected Enemy Unit, with a +2 Modifier applied to those Evade Rolls."
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Biomass)"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Energy Blast"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: 8 | TARGET: All | RoA: 5 | HIT: 3+ | DMG: 1\nSURGE: Light, Armoured (D3)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Leaping Strike"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "If Unengaged, resolve the PLACE (6) effect."
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Biomass)"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Devastating Charge"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Immediately after this Unit completes a successful Charge, resolve the IMPACT (4) 4+ effect."
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": ""
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 6 | HIT: 4+ | DMG: 2\nSURGE: -\n\nCRITICAL HIT (2)"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "name": {
                      "stringValue": "Blades"
                    }
                  }
                }
              }
            ]
          }
        },
        "keywords": {
          "stringValue": ""
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "-"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "1"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "1 - 1"
                    },
                    "supply": {
                      "integerValue": "1"
                    },
                    "tier": {
                      "integerValue": "2"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "-"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "3"
                    }
                  }
                }
              }
            ]
          }
        },
        "id": {
          "stringValue": "kerrigan"
        },
        "small": {
          "mapValue": {
            "fields": {
              "models": {
                "integerValue": "1"
              },
              "cost": {
                "integerValue": "250"
              },
              "supply": {
                "integerValue": "1"
              }
            }
          }
        },
        "faction": {
          "stringValue": "Zerg"
        },
        "large": {
          "mapValue": {
            "fields": {
              "cost": {
                "integerValue": "0"
              },
              "models": {
                "integerValue": "0"
              },
              "supply": {
                "integerValue": "0"
              }
            }
          }
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:23:54.477693Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/kerrigan_swarm_raptor__zergling_",
      "fields": {
        "stats": {
          "mapValue": {
            "fields": {
              "hp": {
                "stringValue": "2"
              },
              "armor": {
                "stringValue": "5+"
              },
              "shield": {
                "stringValue": "-"
              },
              "size": {
                "stringValue": "1"
              },
              "evade": {
                "stringValue": "4+"
              },
              "speed": {
                "stringValue": "5/9"
              }
            }
          }
        },
        "tags": {
          "stringValue": "Biological, Light, Ground, Unique"
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "name": {
                      "stringValue": "Squadron"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit’s Horizontal Coherency is 4\"."
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "description": {
                      "stringValue": "This Unit can move through IMPASSABLE TERRAIN of Size 4 or less and change elevation without using ACCESS POINTS."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Raptor Strain"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "description": {
                      "stringValue": "When determining Charge Distance for this Unit, add 2 to the Charge Distance."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Leap"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Biomass)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Biomass)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit gains a +1 Modifier to all IMPACT Hit Rolls."
                    },
                    "name": {
                      "stringValue": "Adrenal Overload"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Immediately after this Unit completes a successful Charge, resolve the IMPACT (2) 5+ effect."
                    },
                    "name": {
                      "stringValue": "Devastating Charge"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Claws"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 2 | HIT: 3+ | DMG: 1\nSURGE: Light, Armoured (D6)\n\nINSTANT"
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    }
                  }
                }
              }
            ]
          }
        },
        "combatRange": {
          "stringValue": "1"
        },
        "name": {
          "stringValue": "Kerrigan Swarm Raptor (Zergling)"
        },
        "unitType": {
          "stringValue": "Elite"
        },
        "id": {
          "stringValue": "kerrigan_swarm_raptor__zergling_"
        },
        "small": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "1"
              },
              "models": {
                "integerValue": "6"
              },
              "cost": {
                "integerValue": "250"
              }
            }
          }
        },
        "faction": {
          "stringValue": "Zerg"
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "tier": {
                      "integerValue": "1"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "modelCount": {
                      "stringValue": "1 - 3"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "tier": {
                      "integerValue": "2"
                    },
                    "supply": {
                      "integerValue": "1"
                    },
                    "modelCount": {
                      "stringValue": "4 - 6"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "3"
                    },
                    "modelCount": {
                      "stringValue": "-"
                    }
                  }
                }
              }
            ]
          }
        },
        "large": {
          "mapValue": {
            "fields": {
              "models": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              },
              "supply": {
                "integerValue": "0"
              }
            }
          }
        },
        "keywords": {
          "stringValue": "Kerrigan's Swarm"
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:23:54.477693Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/marauder",
      "fields": {
        "unitType": {
          "stringValue": "Core"
        },
        "name": {
          "stringValue": "Marauder"
        },
        "combatRange": {
          "stringValue": "5"
        },
        "tags": {
          "stringValue": "Armoured, Biological, Ground"
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "40"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "name": {
                      "stringValue": "Veteran of Tarsonis"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "While this Unit is Within 3\" of a Mission Marker, its Armour characteristic is increased by 1."
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "name": {
                      "stringValue": "Kinetic Foam"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Increase this Unit's Hit Points characteristic by 1."
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "40"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "description": {
                      "stringValue": "This Unit suffers NON-LETHAL DAMAGE (2). This Unit gains BUFF Speed (3). Additionally, its Quad K12 and all Close Combat Weapons gain PRECISION (2)."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Stimpack"
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Command Point)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": ""
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "description": {
                      "stringValue": "RANGE: 12 | TARGET: Ground | RoA: 3 | HIT: 3+ | DMG: 1\nSURGE: Armoured (D3)\n\nPIERCE Armoured (2)"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "name": {
                      "stringValue": "Quad K12"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Concusive Shells"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When an Enemy declares a Charge against a Friendly Unit Within 8\", that Enemy gains DEBUFF Speed (2)."
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cReaction\u003e\n(1 Command Point)"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "40"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "name": {
                      "stringValue": "Laser Targeting Systems"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit’s Quad K12 weapon gains LONG RANGE (16\")."
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "name": {
                      "stringValue": "Strike"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 2 | HIT: 4+ | DMG: 1\nSURGE: -"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    }
                  }
                }
              }
            ]
          }
        },
        "stats": {
          "mapValue": {
            "fields": {
              "evade": {
                "stringValue": "6+"
              },
              "speed": {
                "stringValue": "4/7"
              },
              "armor": {
                "stringValue": "4+"
              },
              "hp": {
                "stringValue": "5"
              },
              "size": {
                "stringValue": "2"
              },
              "shield": {
                "stringValue": "-"
              }
            }
          }
        },
        "keywords": {
          "stringValue": ""
        },
        "large": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "2"
              },
              "models": {
                "integerValue": "4"
              },
              "cost": {
                "integerValue": "280"
              }
            }
          }
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "1 - 1"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "1"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "supply": {
                      "integerValue": "1"
                    },
                    "tier": {
                      "integerValue": "2"
                    },
                    "modelCount": {
                      "stringValue": "2 - 2"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "supply": {
                      "integerValue": "2"
                    },
                    "tier": {
                      "integerValue": "3"
                    },
                    "modelCount": {
                      "stringValue": "3 - 4"
                    }
                  }
                }
              }
            ]
          }
        },
        "small": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "1"
              },
              "models": {
                "integerValue": "2"
              },
              "cost": {
                "integerValue": "150"
              }
            }
          }
        },
        "faction": {
          "stringValue": "Terran"
        },
        "id": {
          "stringValue": "marauder"
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:23:54.477693Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/marine",
      "fields": {
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Command Point)"
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "name": {
                      "stringValue": "Stimpack"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit suffers NON-LETHAL DAMAGE (2). This Unit gains BUFF Speed (3). Additionally, its C-14 Rifle and all Close Combat Weapons gain PRECISION (3)."
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "30"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e (1 Command Point)"
                    },
                    "name": {
                      "stringValue": "Combat Shield"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit is always eligible to make an Evade Roll against any Close Combat Attack targeting it and any Damage from an Enemy Special Ability."
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": ""
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "description": {
                      "stringValue": "RANGE: 12 | TARGET: All | RoA: 2 | HIT: 3+ | DMG: 1\nSURGE: Light (D3)"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "name": {
                      "stringValue": "C-14 rifle"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "10"
                    },
                    "costL": {
                      "integerValue": "10"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "AGG-12"
                    },
                    "linkedTo": {
                      "stringValue": "C-14 Rifle"
                    },
                    "description": {
                      "stringValue": "RANGE: 12 | TARGET: Ground | RoA: 2 | HIT: 3+ | DMG: 1\nSURGE: Armoured (D3)\n\nLONG RANGE (18\"), SPECIALIST"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Rocket Launcher"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: 12 | TARGET: Ground | RoA: 4 | HIT: 3+ | DMG: 1\nSURGE: -\n\nINDIRECT FIRE, LONG RANGE (18\"), SIDEARM, SPECIALIST"
                    },
                    "costS": {
                      "integerValue": "40"
                    },
                    "costL": {
                      "integerValue": "40"
                    },
                    "activation": {
                      "stringValue": ""
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "name": {
                      "stringValue": "Slugthrower"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit makes a Ranged Attack with a C-14 Rifle and the target is Within 8\", that weapon gains ANTI-EVADE (1)."
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "costS": {
                      "integerValue": "10"
                    },
                    "costL": {
                      "integerValue": "20"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "10"
                    },
                    "costL": {
                      "integerValue": "10"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit makes a Ranged Attack with a C-14 Rifle and the target is Within 8\", that weapon’s S Dice is replaced by D6."
                    },
                    "name": {
                      "stringValue": "Grenades - Frag"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Strike"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 1 | HIT: 5+ | DMG: 1\nSURGE: -"
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": ""
                    },
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "30"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 2 | HIT: 5+ | DMG: 1\nSURGE: -"
                    },
                    "linkedTo": {
                      "stringValue": "Strike"
                    },
                    "name": {
                      "stringValue": "Bayonet"
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    }
                  }
                }
              }
            ]
          }
        },
        "large": {
          "mapValue": {
            "fields": {
              "models": {
                "integerValue": "9"
              },
              "cost": {
                "integerValue": "210"
              },
              "supply": {
                "integerValue": "2"
              }
            }
          }
        },
        "faction": {
          "stringValue": "Terran"
        },
        "tags": {
          "stringValue": "Biological, Light, Ground"
        },
        "frontUrl": {
          "stringValue": "https://firebasestorage.googleapis.com/v0/b/starcrafttmgbeta.firebasestorage.app/o/faction_art%2F1773696430217_marines_13.jpg?alt=media&token=f6069279-0284-4525-98c7-3b05589c3484"
        },
        "stats": {
          "mapValue": {
            "fields": {
              "evade": {
                "stringValue": "5+"
              },
              "speed": {
                "stringValue": "4/7"
              },
              "hp": {
                "stringValue": "2"
              },
              "armor": {
                "stringValue": "5+"
              },
              "shield": {
                "stringValue": "-"
              },
              "size": {
                "stringValue": "2"
              }
            }
          }
        },
        "unitType": {
          "stringValue": "Core"
        },
        "name": {
          "stringValue": "Marine"
        },
        "combatRange": {
          "stringValue": "4"
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "tier": {
                      "integerValue": "1"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "modelCount": {
                      "stringValue": "1 - 3"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "supply": {
                      "integerValue": "1"
                    },
                    "tier": {
                      "integerValue": "2"
                    },
                    "modelCount": {
                      "stringValue": "4 - 6"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "tier": {
                      "integerValue": "3"
                    },
                    "supply": {
                      "integerValue": "2"
                    },
                    "modelCount": {
                      "stringValue": "7 - 9"
                    }
                  }
                }
              }
            ]
          }
        },
        "id": {
          "stringValue": "marine"
        },
        "small": {
          "mapValue": {
            "fields": {
              "cost": {
                "integerValue": "160"
              },
              "models": {
                "integerValue": "6"
              },
              "supply": {
                "integerValue": "1"
              }
            }
          }
        },
        "keywords": {
          "stringValue": ""
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:27:11.851770Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/medic",
      "fields": {
        "stats": {
          "mapValue": {
            "fields": {
              "evade": {
                "stringValue": "5+"
              },
              "speed": {
                "stringValue": "4/7"
              },
              "armor": {
                "stringValue": "5+"
              },
              "hp": {
                "stringValue": "2"
              },
              "size": {
                "stringValue": "2"
              },
              "shield": {
                "stringValue": "-"
              }
            }
          }
        },
        "tags": {
          "stringValue": "Biological, Light, Ground"
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cReaction\u003e\n(1 Command Point)"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "name": {
                      "stringValue": "Life Support"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Use when another Friendly Biological Unit suffers Damage Within 4\". Reduce the Total Damage before allocation by 1 for each model in this Unit that is Within 4\" of the damaged Unit."
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "name": {
                      "stringValue": "Advanced Medic Facilities"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit’s Supply Value counts as 0 when calculating the Supply Pool."
                    },
                    "costS": {
                      "integerValue": "60"
                    },
                    "costL": {
                      "integerValue": "60"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Use when a Friendly Unit Within 4\" receives a DEBUFF. Remove all DEBUFFS from it."
                    },
                    "name": {
                      "stringValue": "Restoration"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "activation": {
                      "stringValue": "\u003cReaction\u003e\n(1 Command Point)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "20"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "name": {
                      "stringValue": "A-13 Flash Grenade Launcher"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Increase the Optical Flare special ability's Range to 16\"."
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "name": {
                      "stringValue": "Stabilizer Medpacks"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit resolves a Life Support or Medpack ability, treat it as having 1 additional model Within Range for calculating that ability's effects."
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "costS": {
                      "integerValue": "30"
                    },
                    "costL": {
                      "integerValue": "30"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "description": {
                      "stringValue": "Select another Friendly Biological Unit Within 4\". Resolve the HEAL (X) effect for the targeted Unit, where X is the number of models in this Unit that are Within 4\" of the target Unit."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Medpack"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Command Point)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(2 Command Point)"
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "name": {
                      "stringValue": "Optical Flare"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Select one Enemy Unit Within 12\". Until the End of the Round, apply DEBUFF Range (4) to that Unit’s Ranged Weapons. That Unit cannot benefit from LONG RANGE."
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "name": {
                      "stringValue": "Strike"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 1 | HIT: 5+ | DMG: 1\nSURGE: -"
                    }
                  }
                }
              }
            ]
          }
        },
        "combatRange": {
          "stringValue": "-"
        },
        "name": {
          "stringValue": "Medic"
        },
        "unitType": {
          "stringValue": "Support"
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "1 - 1"
                    },
                    "tier": {
                      "integerValue": "1"
                    },
                    "supply": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "supply": {
                      "integerValue": "1"
                    },
                    "tier": {
                      "integerValue": "2"
                    },
                    "modelCount": {
                      "stringValue": "2 - 3"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "-"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "3"
                    }
                  }
                }
              }
            ]
          }
        },
        "id": {
          "stringValue": "medic"
        },
        "small": {
          "mapValue": {
            "fields": {
              "cost": {
                "integerValue": "110"
              },
              "models": {
                "integerValue": "3"
              },
              "supply": {
                "integerValue": "1"
              }
            }
          }
        },
        "faction": {
          "stringValue": "Terran"
        },
        "large": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              },
              "models": {
                "integerValue": "0"
              }
            }
          }
        },
        "keywords": {
          "stringValue": ""
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:23:54.477693Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/omega_worm",
      "fields": {
        "large": {
          "mapValue": {
            "fields": {
              "cost": {
                "integerValue": "0"
              },
              "models": {
                "integerValue": "0"
              },
              "supply": {
                "integerValue": "0"
              }
            }
          }
        },
        "faction": {
          "stringValue": "Zerg"
        },
        "small": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              },
              "models": {
                "integerValue": "1"
              }
            }
          }
        },
        "id": {
          "stringValue": "omega_worm"
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "1"
                    },
                    "modelCount": {
                      "stringValue": "-"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "1 - 1"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "2"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "-"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "3"
                    }
                  }
                }
              }
            ]
          }
        },
        "keywords": {
          "stringValue": "Kerrigan's Swarm"
        },
        "tags": {
          "stringValue": "Armoured, Biological, Ground"
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "While Enemy Units are Within 6\" of this Unit, they lose HIDDEN Status."
                    },
                    "name": {
                      "stringValue": "Detection"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "name": {
                      "stringValue": "Source of Creep"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "A Friendly or Enemy Ground Zerg Unit Within 6\" of this Unit, counts as being ON CREEP."
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "description": {
                      "stringValue": "This Unit cannot be Activated in any Phase and cannot perform actions. Additionally, its Current Supply Value is treated as 0, and it can never Control or Contest Mission Markers, ignoring the standard Zero Supply Exception. This Unit cannot be a target of an ability, unless stated otherwise."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Structure"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "name": {
                      "stringValue": "Omega Network"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "The base of the Omega Worm counts as an Entry Edge. Each Round, Friendly Units with a combined Supply cost of 2 or less may be Deployed via this Entry Edge.\n\nIf a Friendly Leading model finishes a Move, Disengage, or Run action in base-to-base contact with the Omega Worm, the controlling player may remove that Unit from the battlefield and return it to Reserves."
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    }
                  }
                }
              }
            ]
          }
        },
        "stats": {
          "mapValue": {
            "fields": {
              "size": {
                "stringValue": "3"
              },
              "shield": {
                "stringValue": "-"
              },
              "armor": {
                "stringValue": "5+"
              },
              "hp": {
                "stringValue": "10"
              },
              "speed": {
                "stringValue": "-"
              },
              "evade": {
                "stringValue": "-"
              }
            }
          }
        },
        "name": {
          "stringValue": "Omega Worm"
        },
        "unitType": {
          "stringValue": "Other"
        },
        "combatRange": {
          "stringValue": "-"
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:23:54.477693Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/point_defense_drone",
      "fields": {
        "combatRange": {
          "stringValue": "-"
        },
        "name": {
          "stringValue": "Point Defense Drone"
        },
        "unitType": {
          "stringValue": "Other"
        },
        "stats": {
          "mapValue": {
            "fields": {
              "evade": {
                "stringValue": "6+"
              },
              "speed": {
                "stringValue": "-"
              },
              "armor": {
                "stringValue": "6+"
              },
              "hp": {
                "stringValue": "3"
              },
              "size": {
                "stringValue": "-"
              },
              "shield": {
                "stringValue": "-"
              }
            }
          }
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "description": {
                      "stringValue": "When another Friendly Unit Within 4\" is targeted by a Ranged Attack without the INSTANT keyword, remove up to 2 dice from the Attack Pool. Then remove this Unit from the battlefield."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Point Defense Laser"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "name": {
                      "stringValue": "Gliding"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This model has DISPLACEMENT."
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "name": {
                      "stringValue": "Structure"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit cannot be Activated in any Phase and cannot perform actions. Additionally, its Current Supply Value is treated as 0, and it can never Control or Contest Mission Markers, ignoring the standard Zero Supply Exception. This Unit cannot be a target of an ability, unless stated otherwise."
                    }
                  }
                }
              }
            ]
          }
        },
        "tags": {
          "stringValue": "Armoured, Flying, Mechanical"
        },
        "keywords": {
          "stringValue": "Raynor's Raiders"
        },
        "id": {
          "stringValue": "point_defense_drone"
        },
        "faction": {
          "stringValue": "Terran"
        },
        "small": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              },
              "models": {
                "integerValue": "1"
              }
            }
          }
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "1"
                    },
                    "modelCount": {
                      "stringValue": "-"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "1 - 1"
                    },
                    "tier": {
                      "integerValue": "2"
                    },
                    "supply": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "-"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "3"
                    }
                  }
                }
              }
            ]
          }
        },
        "large": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              },
              "models": {
                "integerValue": "0"
              }
            }
          }
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:23:54.477693Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/praetor_guard__zealot_",
      "fields": {
        "keywords": {
          "stringValue": "Khalai"
        },
        "large": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "0"
              },
              "models": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              }
            }
          }
        },
        "id": {
          "stringValue": "praetor_guard__zealot_"
        },
        "faction": {
          "stringValue": "Protoss"
        },
        "small": {
          "mapValue": {
            "fields": {
              "models": {
                "integerValue": "3"
              },
              "cost": {
                "integerValue": "280"
              },
              "supply": {
                "integerValue": "2"
              }
            }
          }
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "tier": {
                      "integerValue": "1"
                    },
                    "supply": {
                      "integerValue": "1"
                    },
                    "modelCount": {
                      "stringValue": "1 - 1"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "tier": {
                      "integerValue": "2"
                    },
                    "supply": {
                      "integerValue": "2"
                    },
                    "modelCount": {
                      "stringValue": "2 - 3"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "-"
                    },
                    "tier": {
                      "integerValue": "3"
                    },
                    "supply": {
                      "integerValue": "0"
                    }
                  }
                }
              }
            ]
          }
        },
        "name": {
          "stringValue": "Praetor Guard (Zealot)"
        },
        "unitType": {
          "stringValue": "Elite"
        },
        "combatRange": {
          "stringValue": "1"
        },
        "tags": {
          "stringValue": "Biological, Light, Ground, Unique"
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "name": {
                      "stringValue": "Shield Overcharge"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit gains TOUGH (2) on the first Armour Roll each Round."
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "description": {
                      "stringValue": "This Unit performs a 2\" Move action. This does not count towards its action limit."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Leg Enhancements"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Psionic Energy)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When determining Charge Distance for this Unit, roll 2D6 instead of D6 and use the higher result to add to the Unit’s Speed characteristic."
                    },
                    "name": {
                      "stringValue": "Charge"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Psionic Energy)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Devastating Charge"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Immediately after this Unit completes a successful Charge, resolve the IMPACT (3) 4+ effect."
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "name": {
                      "stringValue": "Psi Blades"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 4 | HIT: 3+ | DMG: 1\nSURGE: Light (D3)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit makes a Close Combat Attack, and the target is Size 3 or larger, the weapon’s Damage characteristic is treated as 2."
                    },
                    "name": {
                      "stringValue": "Titan Killers"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit is eligible to make an Evade roll against all attacks targeting it."
                    },
                    "name": {
                      "stringValue": "Precognition"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              }
            ]
          }
        },
        "stats": {
          "mapValue": {
            "fields": {
              "hp": {
                "stringValue": "4"
              },
              "armor": {
                "stringValue": "5+"
              },
              "shield": {
                "stringValue": "3"
              },
              "size": {
                "stringValue": "2"
              },
              "evade": {
                "stringValue": "5+"
              },
              "speed": {
                "stringValue": "4/7"
              }
            }
          }
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-09T17:51:49.738778Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/pylon",
      "fields": {
        "stats": {
          "mapValue": {
            "fields": {
              "speed": {
                "stringValue": "-"
              },
              "evade": {
                "stringValue": "-"
              },
              "size": {
                "stringValue": "3"
              },
              "shield": {
                "stringValue": "2"
              },
              "armor": {
                "stringValue": "5+"
              },
              "hp": {
                "stringValue": "8"
              }
            }
          }
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "name": {
                      "stringValue": "Structure"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit cannot be Activated in any Phase and cannot perform actions. Additionally, its Current Supply Value is treated as 0, and it can never Control or Contest Mission Markers, ignoring the standard Zero Supply Exception. This Unit cannot be a target of an ability, unless stated otherwise."
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "description": {
                      "stringValue": "Once per Round, when a Friendly Unit Within 4\" of this Pylon uses a Special Ability that costs Psionic Energy, that ability’s PE cost is reduced by 1."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Khalai Ingenuity"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "name": {
                      "stringValue": "Warp Conduit"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Once per Round, the controlling player may deploy a Ground Unit from Reserves using this Pylon base as the Entry Edge. This Unit's Activation ends."
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    }
                  }
                }
              }
            ]
          }
        },
        "tags": {
          "stringValue": "Armored, Ground"
        },
        "combatRange": {
          "stringValue": "-"
        },
        "unitType": {
          "stringValue": "Other"
        },
        "name": {
          "stringValue": "Pylon"
        },
        "id": {
          "stringValue": "pylon"
        },
        "faction": {
          "stringValue": "Protoss"
        },
        "small": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              },
              "models": {
                "integerValue": "1"
              }
            }
          }
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "tier": {
                      "integerValue": "1"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "modelCount": {
                      "stringValue": "-"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "tier": {
                      "integerValue": "2"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "modelCount": {
                      "stringValue": "1 - 1"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "3"
                    },
                    "modelCount": {
                      "stringValue": "-"
                    }
                  }
                }
              }
            ]
          }
        },
        "large": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "0"
              },
              "models": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              }
            }
          }
        },
        "keywords": {
          "stringValue": "Khalai"
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-09T17:51:49.738778Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/queen",
      "fields": {
        "name": {
          "stringValue": "Queen"
        },
        "unitType": {
          "stringValue": "Support"
        },
        "combatRange": {
          "stringValue": "2"
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Set a Creep Tumor token in base-to-base contact with this Unit."
                    },
                    "name": {
                      "stringValue": "Spawn Creep Tumor"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Biomass)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cReaction\u003e\n(1 Biomass)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "description": {
                      "stringValue": "Use when another Friendly Biological Unit (including a Structure) suffers Damage Within 4\". Reduce the Total Damage before allocation by 2."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Transfusion"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Use when a Friendly Unit Within 4\" receives a DEBUFF. Remove all DEBUFFS from it."
                    },
                    "name": {
                      "stringValue": "Restoration"
                    },
                    "activation": {
                      "stringValue": "\u003cReaction\u003e\n(1 Biomass)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "name": {
                      "stringValue": "Psionic Link"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Once per Round, if there are at least 7 Friendly models Within 6\" of this Unit, it may resolve its Special Ability with the BM cost reduced by 1."
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "description": {
                      "stringValue": "While this Unit is ON CREEP, increase this Unit's Speed characteristic by 2."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Creep Speed"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "10"
                    },
                    "costL": {
                      "integerValue": "10"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Select another Friendly Unit Within 6\" (Line of Sight is not required). That Unit’s Supply characteristic is increased by 1 for Controlling and Contesting Mission Markers and completing objectives."
                    },
                    "name": {
                      "stringValue": "Domineering Presence"
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Biomass)"
                    },
                    "costS": {
                      "integerValue": "10"
                    },
                    "costL": {
                      "integerValue": "10"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "description": {
                      "stringValue": "RANGE: 6 | TARGET: Ground | RoA: 4 | HIT: 4+ | DMG: 2\nSURGE: Light (D3)"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "name": {
                      "stringValue": "Talons"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Acid spines"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: 12 | TARGET: Flying | RoA: 4 | HIT: 4+ | DMG: 2\nSURGE: Light, Armoured (D3)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "description": {
                      "stringValue": "Immediately after this Unit completes a successful Charge, resolve the IMPACT (4) 3+ effect."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Devastating Charge"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "name": {
                      "stringValue": "Talons"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 3 | HIT: 4+ | DMG: 1\nSURGE: -"
                    }
                  }
                }
              }
            ]
          }
        },
        "tags": {
          "stringValue": "Armoured, Biological, Psionic, Ground"
        },
        "stats": {
          "mapValue": {
            "fields": {
              "evade": {
                "stringValue": "-"
              },
              "speed": {
                "stringValue": "4"
              },
              "armor": {
                "stringValue": "4+"
              },
              "hp": {
                "stringValue": "9"
              },
              "size": {
                "stringValue": "3"
              },
              "shield": {
                "stringValue": "-"
              }
            }
          }
        },
        "keywords": {
          "stringValue": ""
        },
        "large": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              },
              "models": {
                "integerValue": "0"
              }
            }
          }
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "-"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "1"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "tier": {
                      "integerValue": "2"
                    },
                    "supply": {
                      "integerValue": "1"
                    },
                    "modelCount": {
                      "stringValue": "1 - 1"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "-"
                    },
                    "tier": {
                      "integerValue": "3"
                    },
                    "supply": {
                      "integerValue": "0"
                    }
                  }
                }
              }
            ]
          }
        },
        "id": {
          "stringValue": "queen"
        },
        "faction": {
          "stringValue": "Zerg"
        },
        "small": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "1"
              },
              "cost": {
                "integerValue": "150"
              },
              "models": {
                "integerValue": "1"
              }
            }
          }
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:23:54.477693Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/raptor__zergling_",
      "fields": {
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "1 - 6"
                    },
                    "tier": {
                      "integerValue": "1"
                    },
                    "supply": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "7 - 12"
                    },
                    "supply": {
                      "integerValue": "1"
                    },
                    "tier": {
                      "integerValue": "2"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "13 - 18"
                    },
                    "tier": {
                      "integerValue": "3"
                    },
                    "supply": {
                      "integerValue": "2"
                    }
                  }
                }
              }
            ]
          }
        },
        "id": {
          "stringValue": "raptor__zergling_"
        },
        "faction": {
          "stringValue": "Zerg"
        },
        "small": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "1"
              },
              "cost": {
                "integerValue": "240"
              },
              "models": {
                "integerValue": "12"
              }
            }
          }
        },
        "large": {
          "mapValue": {
            "fields": {
              "cost": {
                "integerValue": "300"
              },
              "models": {
                "integerValue": "18"
              },
              "supply": {
                "integerValue": "2"
              }
            }
          }
        },
        "keywords": {
          "stringValue": ""
        },
        "stats": {
          "mapValue": {
            "fields": {
              "armor": {
                "stringValue": "6+"
              },
              "hp": {
                "stringValue": "1"
              },
              "size": {
                "stringValue": "1"
              },
              "shield": {
                "stringValue": "-"
              },
              "evade": {
                "stringValue": "4+"
              },
              "speed": {
                "stringValue": "5/9"
              }
            }
          }
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "name": {
                      "stringValue": "Squadron"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit’s Horizontal Coherency is 4\"."
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "name": {
                      "stringValue": "Raptor Strain"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit can move through IMPASSABLE TERRAIN of Size 4 or less and change elevation without using ACCESS POINTS."
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "30"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "name": {
                      "stringValue": "Burrow Ambush"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit is nominated to deploy from the Reserves, it may resolve the PLACE (18) effect from the controlling player's Entry Edge. No model may be set Within 10\" of any Enemy model. This Unit's Activation ends."
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Biomass)"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Adrenal Overload"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit gains a +1 Modifier to all IMPACT Hit Rolls."
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Biomass)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When determining Charge Distance for this Unit, roll 2D6 instead of D6 and use the higher result to add to the Unit’s Speed characteristic."
                    },
                    "name": {
                      "stringValue": "Metabolic Boost"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Devastating Charge"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Immediately after this Unit completes a successful Charge, resolve the IMPACT (1) 5+ effect."
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "name": {
                      "stringValue": "Claws"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 2 | HIT: 4+ | DMG: 1\nSURGE: Light (D3)"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "20"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "name": {
                      "stringValue": "Shredding Claws"
                    },
                    "linkedTo": {
                      "stringValue": "Claws"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 2 | HIT: 4+ | DMG: 1\nSURGE: Light, Armoured (D3)"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "name": {
                      "stringValue": "Adrenal Glands"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit’s Claws and Shredding Claws weapons gain PRECISION (2)."
                    },
                    "costS": {
                      "integerValue": "30"
                    },
                    "costL": {
                      "integerValue": "30"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              }
            ]
          }
        },
        "tags": {
          "stringValue": "Biological, Light, Ground"
        },
        "combatRange": {
          "stringValue": "1"
        },
        "unitType": {
          "stringValue": "Elite"
        },
        "name": {
          "stringValue": "Raptor (Zergling)"
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:23:54.477693Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/raynor_s_raider__marine_",
      "fields": {
        "large": {
          "mapValue": {
            "fields": {
              "models": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              },
              "supply": {
                "integerValue": "0"
              }
            }
          }
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "-"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "1"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "tier": {
                      "integerValue": "2"
                    },
                    "supply": {
                      "integerValue": "1"
                    },
                    "modelCount": {
                      "stringValue": "1 - 6"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "-"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "3"
                    }
                  }
                }
              }
            ]
          }
        },
        "id": {
          "stringValue": "raynor_s_raider__marine_"
        },
        "faction": {
          "stringValue": "Terran"
        },
        "small": {
          "mapValue": {
            "fields": {
              "cost": {
                "integerValue": "230"
              },
              "models": {
                "integerValue": "6"
              },
              "supply": {
                "integerValue": "1"
              }
            }
          }
        },
        "keywords": {
          "stringValue": "Raynor's Raiders"
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Command Point)"
                    },
                    "name": {
                      "stringValue": "Stimpack"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit suffers NON-LETHAL DAMAGE (2). This Unit gains BUFF Speed (3). Additionally, its C-14 Rifle and all Close Combat Weapons gain PRECISION (3)."
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit is nominated to deploy from Reserves, it may resolve its Stimpack ability with the CP cost reduced by 1 (to a minimum of 0)."
                    },
                    "name": {
                      "stringValue": "Raiders Roll!"
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "name": {
                      "stringValue": "Rapid Reinforcements"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit is nominated to deploy from Reserves, it may resolve the PLACE (10) effect from another Friendly Unit. No model may be set Within 8\" of any Enemy model. This Unit's Activation ends."
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "C-14 rifle"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: 12 | TARGET: All | RoA: 2 | HIT: 3+ | DMG: 1\nSURGE: Light (D3)"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "name": {
                      "stringValue": "Slugthrower"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit makes a Ranged Attack with a C-14 Rifle and the target is Within 8\", that weapon gains ANTI-EVADE (1)."
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit makes a Ranged Attack with a C-14 Rifle and the target is Within 8\", that weapon’s S Dice is replaced by D6."
                    },
                    "name": {
                      "stringValue": "Grenades - Frag"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "name": {
                      "stringValue": "Bayonet"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 2 | HIT: 5+ | DMG: 1\nSURGE: -"
                    }
                  }
                }
              }
            ]
          }
        },
        "tags": {
          "stringValue": "Biological, Light, Ground"
        },
        "stats": {
          "mapValue": {
            "fields": {
              "evade": {
                "stringValue": "5+"
              },
              "speed": {
                "stringValue": "4/7"
              },
              "armor": {
                "stringValue": "5+"
              },
              "hp": {
                "stringValue": "2"
              },
              "size": {
                "stringValue": "2"
              },
              "shield": {
                "stringValue": "-"
              }
            }
          }
        },
        "unitType": {
          "stringValue": "Core"
        },
        "name": {
          "stringValue": "Raynor's Raider (Marine)"
        },
        "combatRange": {
          "stringValue": "4"
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:23:54.477693Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/roach",
      "fields": {
        "stats": {
          "mapValue": {
            "fields": {
              "evade": {
                "stringValue": "5+"
              },
              "speed": {
                "stringValue": "4/7"
              },
              "hp": {
                "stringValue": "4"
              },
              "armor": {
                "stringValue": "3+"
              },
              "shield": {
                "stringValue": "-"
              },
              "size": {
                "stringValue": "2"
              }
            }
          }
        },
        "tags": {
          "stringValue": "Armoured, Biological, Ground"
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "name": {
                      "stringValue": "Burrow"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "If this Unit is Unengaged, it gains or loses the Burrowed Status."
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(2 Biomass)"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "While this Unit has the Burrowed Status, it may perform the Move and Run actions without losing that Status. It may also move through other Units’ bases."
                    },
                    "name": {
                      "stringValue": "Tunneling Claws"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "10"
                    },
                    "costL": {
                      "integerValue": "10"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "20"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "name": {
                      "stringValue": "Burrow Ambush"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit is nominated to deploy from the Reserves, it may resolve the PLACE (18) effect from the controlling player's Entry Edge. No model may be set Within 10\" of any Enemy model. This Unit's Activation ends."
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Biomass)"
                    },
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "20"
                    },
                    "description": {
                      "stringValue": "This Unit gains BUFF SPEED (1), or BUFF SPEED (2) if the Unit is ON CREEP."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Glial Reconstitution"
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Acid Saliva"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: 8 | TARGET: Ground | RoA: 3 | HIT: 3+ | DMG: 1\nSURGE: -"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "name": {
                      "stringValue": "Regeneration"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit becomes Activated, if it has the Burrowed Status, resolve the HEAL (2) effect."
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "10"
                    },
                    "costL": {
                      "integerValue": "10"
                    },
                    "description": {
                      "stringValue": "This Unit's Acid Saliva weapon gains Surge Type: Light, and S Dice: D3+1."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Hydriodic Bile"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Devastating Charge"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Immediately after this Unit completes a successful Charge, resolve the IMPACT (2) 4+ effect."
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 2 | HIT: 4+ | DMG: 1\nSURGE: -"
                    },
                    "name": {
                      "stringValue": "Claws"
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              }
            ]
          }
        },
        "combatRange": {
          "stringValue": "2"
        },
        "name": {
          "stringValue": "Roach"
        },
        "unitType": {
          "stringValue": "Core"
        },
        "id": {
          "stringValue": "roach"
        },
        "faction": {
          "stringValue": "Zerg"
        },
        "small": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "1"
              },
              "models": {
                "integerValue": "3"
              },
              "cost": {
                "integerValue": "170"
              }
            }
          }
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "1 - 1"
                    },
                    "tier": {
                      "integerValue": "1"
                    },
                    "supply": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "tier": {
                      "integerValue": "2"
                    },
                    "supply": {
                      "integerValue": "1"
                    },
                    "modelCount": {
                      "stringValue": "2 - 3"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "-"
                    },
                    "tier": {
                      "integerValue": "3"
                    },
                    "supply": {
                      "integerValue": "0"
                    }
                  }
                }
              }
            ]
          }
        },
        "large": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "0"
              },
              "models": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              }
            }
          }
        },
        "keywords": {
          "stringValue": ""
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:23:54.477693Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/roachling",
      "fields": {
        "keywords": {
          "stringValue": ""
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "-"
                    },
                    "tier": {
                      "integerValue": "1"
                    },
                    "supply": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "1 - 3"
                    },
                    "tier": {
                      "integerValue": "2"
                    },
                    "supply": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "-"
                    },
                    "tier": {
                      "integerValue": "3"
                    },
                    "supply": {
                      "integerValue": "0"
                    }
                  }
                }
              }
            ]
          }
        },
        "id": {
          "stringValue": "roachling"
        },
        "small": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "0"
              },
              "models": {
                "integerValue": "3"
              },
              "cost": {
                "integerValue": "0"
              }
            }
          }
        },
        "faction": {
          "stringValue": "Zerg"
        },
        "large": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "0"
              },
              "models": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              }
            }
          }
        },
        "combatRange": {
          "stringValue": "1"
        },
        "unitType": {
          "stringValue": "Other"
        },
        "name": {
          "stringValue": "Roachling"
        },
        "stats": {
          "mapValue": {
            "fields": {
              "shield": {
                "stringValue": "-"
              },
              "size": {
                "stringValue": "1"
              },
              "hp": {
                "stringValue": "1"
              },
              "armor": {
                "stringValue": "6+"
              },
              "speed": {
                "stringValue": "4/7"
              },
              "evade": {
                "stringValue": "6+"
              }
            }
          }
        },
        "tags": {
          "stringValue": "Biological, Light, Ground"
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit cannot gain Burrowed Status."
                    },
                    "name": {
                      "stringValue": "Underdeveloped Claws"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 2 | HIT: 4+ | DMG: 1\nSURGE: -"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "name": {
                      "stringValue": "Claws"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              }
            ]
          }
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-09T17:51:49.738778Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/sentry",
      "fields": {
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "1 - 1"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "1"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "tier": {
                      "integerValue": "2"
                    },
                    "supply": {
                      "integerValue": "1"
                    },
                    "modelCount": {
                      "stringValue": "2 - 2"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "3"
                    },
                    "modelCount": {
                      "stringValue": "-"
                    }
                  }
                }
              }
            ]
          }
        },
        "id": {
          "stringValue": "sentry"
        },
        "faction": {
          "stringValue": "Protoss"
        },
        "small": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "1"
              },
              "cost": {
                "integerValue": "130"
              },
              "models": {
                "integerValue": "2"
              }
            }
          }
        },
        "large": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "0"
              },
              "models": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              }
            }
          }
        },
        "keywords": {
          "stringValue": ""
        },
        "stats": {
          "mapValue": {
            "fields": {
              "shield": {
                "stringValue": "2"
              },
              "size": {
                "stringValue": "1"
              },
              "hp": {
                "stringValue": "4"
              },
              "armor": {
                "stringValue": "5+"
              },
              "speed": {
                "stringValue": "4/7"
              },
              "evade": {
                "stringValue": "6+"
              }
            }
          }
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Use when a Friendly Unit Within 4\" receives a DEBUFF. Remove all DEBUFFS from it."
                    },
                    "name": {
                      "stringValue": "Restoration"
                    },
                    "activation": {
                      "stringValue": "\u003cReaction\u003e\n(1 Psionic Energy)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "name": {
                      "stringValue": "Force Field"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Set a Force Field token Within 8\" in an unoccupied space. Units of Size 2 or lower cannot move across Force Fields. Models of Size 3 or more can move over it, and it's then removed."
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Psionic Energy)"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "All Ranged Attacks targeting a Friendly Unit Within 4\" (Line of Sight is not required) are made with 1 fewer die in the Attack Pool."
                    },
                    "name": {
                      "stringValue": "Guardian Shield"
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Psionic Energy)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "name": {
                      "stringValue": "Solid-Field Projectors"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Set a Force Field token Within 8\" in an unoccupied space. Units of Size 2 or lower cannot move across Force Fields. Models of Size 3 or more can move over it, and it's then removed."
                    },
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "20"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Psionic Energy)"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Disruption Beam"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: 8 | TARGET: All | RoA: 2 | HIT: 2+ | DMG: 1\nSURGE: -\n\nINSTANT"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "name": {
                      "stringValue": "Hallucination"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When an Enemy Unit declares a Ranged Attack against a Friendly Unit Within 4\", the targeted Friendly Unit is eligible to make an Evade Roll against that attack."
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "costS": {
                      "integerValue": "30"
                    },
                    "costL": {
                      "integerValue": "30"
                    },
                    "activation": {
                      "stringValue": "\u003cReaction\u003e\n(0 Psionic Energy)"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 2 | HIT: 3+ | DMG: 1\nSURGE: -"
                    },
                    "name": {
                      "stringValue": "Beam"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              }
            ]
          }
        },
        "tags": {
          "stringValue": "Light, Mechanical, Psionic, Ground"
        },
        "combatRange": {
          "stringValue": "4"
        },
        "name": {
          "stringValue": "Sentry"
        },
        "unitType": {
          "stringValue": "Support"
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:23:54.477693Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/stalker",
      "fields": {
        "large": {
          "mapValue": {
            "fields": {
              "models": {
                "integerValue": "2"
              },
              "cost": {
                "integerValue": "260"
              },
              "supply": {
                "integerValue": "2"
              }
            }
          }
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "1"
                    },
                    "modelCount": {
                      "stringValue": "-"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "supply": {
                      "integerValue": "1"
                    },
                    "tier": {
                      "integerValue": "2"
                    },
                    "modelCount": {
                      "stringValue": "1 - 1"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "2 - 2"
                    },
                    "tier": {
                      "integerValue": "3"
                    },
                    "supply": {
                      "integerValue": "2"
                    }
                  }
                }
              }
            ]
          }
        },
        "id": {
          "stringValue": "stalker"
        },
        "faction": {
          "stringValue": "Protoss"
        },
        "small": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "1"
              },
              "models": {
                "integerValue": "1"
              },
              "cost": {
                "integerValue": "160"
              }
            }
          }
        },
        "keywords": {
          "stringValue": ""
        },
        "tags": {
          "stringValue": "Armoured, Mechanical, Ground"
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "name": {
                      "stringValue": "Squadron"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit’s Horizontal Coherency is 4\"."
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "40"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Psionic Energy)"
                    },
                    "name": {
                      "stringValue": "Path of Shadows"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit gains HIDDEN Status until it performs another action."
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Resolve the PLACE (6) effect. Models set by this effect cannot be set up Within the Engagement Range of any Enemy Unit."
                    },
                    "name": {
                      "stringValue": "Blink"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Psionic Energy)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Fury of the Nerazim"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit attacks an Enemy Unit that has already been Activated during this Phase, its Particle Disruptors gain INSTANT for that attack."
                    },
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "30"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Particle Disruptors"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: 12 | TARGET: All | RoA: 4 | HIT: 3+ | DMG: 2\nSURGE: Armoured (D3)"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": ""
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 2 | HIT: 5+ | DMG: 1\nSURGE: -"
                    },
                    "name": {
                      "stringValue": "Stomp"
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    }
                  }
                }
              }
            ]
          }
        },
        "stats": {
          "mapValue": {
            "fields": {
              "speed": {
                "stringValue": "4/8"
              },
              "evade": {
                "stringValue": "6+"
              },
              "shield": {
                "stringValue": "3"
              },
              "size": {
                "stringValue": "3"
              },
              "hp": {
                "stringValue": "6"
              },
              "armor": {
                "stringValue": "4+"
              }
            }
          }
        },
        "name": {
          "stringValue": "Stalker"
        },
        "unitType": {
          "stringValue": "Elite"
        },
        "combatRange": {
          "stringValue": "5"
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:23:54.477693Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/swarmling__zergling_",
      "fields": {
        "unitType": {
          "stringValue": "Core"
        },
        "name": {
          "stringValue": "Swarmling (Zergling)"
        },
        "combatRange": {
          "stringValue": "1"
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit’s Horizontal Coherency is 4\"."
                    },
                    "name": {
                      "stringValue": "Squadron"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "20"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "name": {
                      "stringValue": "Burrow Ambush"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit is nominated to deploy from the Reserves, it may resolve the PLACE (18) effect from the controlling player's Entry Edge. No model may be set Within 10\" of any Enemy model. This Unit's Activation ends."
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "description": {
                      "stringValue": "Resolve the RESPAWN (2) effect, or RESPAWN (3) if the Unit is ON CREEP."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Zergling Reconstitution"
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Biomass)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Biomass)"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Metabolic Boost"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When determining Charge Distance for this Unit, roll 2D6 instead of D6 and use the higher result to add to the Unit’s Speed characteristic."
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Immediately after this Unit completes a successful Charge, resolve the IMPACT (1) 5+ effect."
                    },
                    "name": {
                      "stringValue": "Devastating Charge"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "name": {
                      "stringValue": "Claws"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 2 | HIT: 5+ | DMG: 1\nSURGE: -"
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    }
                  }
                }
              }
            ]
          }
        },
        "tags": {
          "stringValue": "Biological, Light, Ground"
        },
        "stats": {
          "mapValue": {
            "fields": {
              "speed": {
                "stringValue": "4/8"
              },
              "evade": {
                "stringValue": "5+"
              },
              "size": {
                "stringValue": "1"
              },
              "shield": {
                "stringValue": "-"
              },
              "armor": {
                "stringValue": "6+"
              },
              "hp": {
                "stringValue": "1"
              }
            }
          }
        },
        "keywords": {
          "stringValue": ""
        },
        "large": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "0"
              },
              "models": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              }
            }
          }
        },
        "id": {
          "stringValue": "swarmling__zergling_"
        },
        "faction": {
          "stringValue": "Zerg"
        },
        "small": {
          "mapValue": {
            "fields": {
              "cost": {
                "integerValue": "270"
              },
              "models": {
                "integerValue": "18"
              },
              "supply": {
                "integerValue": "1"
              }
            }
          }
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "1 - 6"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "1"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "7 - 18"
                    },
                    "supply": {
                      "integerValue": "1"
                    },
                    "tier": {
                      "integerValue": "2"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "-"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "3"
                    }
                  }
                }
              }
            ]
          }
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:23:54.477693Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/vile__roach_",
      "fields": {
        "small": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "1"
              },
              "models": {
                "integerValue": "3"
              },
              "cost": {
                "integerValue": "200"
              }
            }
          }
        },
        "faction": {
          "stringValue": "Zerg"
        },
        "id": {
          "stringValue": "vile__roach_"
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "1"
                    },
                    "modelCount": {
                      "stringValue": "1 - 1"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "supply": {
                      "integerValue": "1"
                    },
                    "tier": {
                      "integerValue": "2"
                    },
                    "modelCount": {
                      "stringValue": "2 - 3"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "tier": {
                      "integerValue": "3"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "modelCount": {
                      "stringValue": "-"
                    }
                  }
                }
              }
            ]
          }
        },
        "large": {
          "mapValue": {
            "fields": {
              "models": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              },
              "supply": {
                "integerValue": "0"
              }
            }
          }
        },
        "keywords": {
          "stringValue": ""
        },
        "stats": {
          "mapValue": {
            "fields": {
              "evade": {
                "stringValue": "5+"
              },
              "speed": {
                "stringValue": "4/7"
              },
              "armor": {
                "stringValue": "3+"
              },
              "hp": {
                "stringValue": "4"
              },
              "size": {
                "stringValue": "2"
              },
              "shield": {
                "stringValue": "-"
              }
            }
          }
        },
        "tags": {
          "stringValue": "Armoured, Biological, Ground"
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cReaction\u003e\n(1 Biomass)"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "name": {
                      "stringValue": "Debilitating Saliva"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Use when an Enemy Unit Within 8\" of this Unit declares a Ranged Attack. Apply DEBUFF Hit (1) to each of that Unit's Ranged Weapons."
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "name": {
                      "stringValue": "Burrow"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "If this Unit is Unengaged, it gains or loses the Burrowed Status."
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(2 Biomass)"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "description": {
                      "stringValue": "While this Unit has the Burrowed Status, it may perform the Move and Run actions without losing that Status. It may also move through other Units’ bases."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Tunneling Claws"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "10"
                    },
                    "costL": {
                      "integerValue": "10"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "20"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "name": {
                      "stringValue": "Burrow Ambush"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit is nominated to deploy from the Reserves, it may resolve the PLACE (18) effect from the controlling player's Entry Edge. No model may be set Within 10\" of any Enemy model. This Unit's Activation ends."
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "name": {
                      "stringValue": "Glial Reconstitution"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit gains BUFF SPEED (1), or BUFF SPEED (2) if the Unit is ON CREEP."
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "20"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Biomass)"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": ""
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "description": {
                      "stringValue": "RANGE: 8 | TARGET: Ground | RoA: 4 | HIT: 3+ | DMG: 1\nSURGE: -"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "name": {
                      "stringValue": "Acid Saliva"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit becomes Activated, if it has the Burrowed Status, resolve the HEAL (2) effect."
                    },
                    "name": {
                      "stringValue": "Regeneration"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "10"
                    },
                    "costL": {
                      "integerValue": "10"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Hydriodic Bile"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit's Acid Saliva weapon gains Surge Type: Light, and S Dice: D3+1."
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Immediately after this Unit completes a successful Charge, resolve the IMPACT (1) 4+ effect."
                    },
                    "name": {
                      "stringValue": "Devastating Charge"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "name": {
                      "stringValue": "Vile Claws"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 2 | HIT: 4+ | DMG: 1\nSURGE: -"
                    }
                  }
                }
              }
            ]
          }
        },
        "combatRange": {
          "stringValue": "3"
        },
        "unitType": {
          "stringValue": "Core"
        },
        "name": {
          "stringValue": "Vile (Roach)"
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:23:54.477693Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/zealot",
      "fields": {
        "stats": {
          "mapValue": {
            "fields": {
              "speed": {
                "stringValue": "4/7"
              },
              "evade": {
                "stringValue": "5+"
              },
              "shield": {
                "stringValue": "3"
              },
              "size": {
                "stringValue": "2"
              },
              "hp": {
                "stringValue": "4"
              },
              "armor": {
                "stringValue": "5+"
              }
            }
          }
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "10"
                    },
                    "costL": {
                      "integerValue": "10"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "name": {
                      "stringValue": "My Life for Aiur"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit resolves IMPACT, each eligible model generates 1 additional IMPACT die."
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "description": {
                      "stringValue": "This Unit performs a 2\" Move action. This does not count towards its action limit."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Leg Enhancements"
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    },
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Psionic Energy)"
                    },
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "20"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Psionic Energy)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When determining Charge Distance for this Unit, roll 2D6 instead of D6 and use the higher result to add to the Unit’s Speed characteristic."
                    },
                    "name": {
                      "stringValue": "Charge"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Devastating Charge"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Immediately after this Unit completes a successful Charge, resolve the IMPACT (3) 4+ effect."
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "10"
                    },
                    "costL": {
                      "integerValue": "10"
                    },
                    "activation": {
                      "stringValue": "\u003cReaction\u003e\n(0 Psionic Energy)"
                    },
                    "name": {
                      "stringValue": "Zealous Round"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit is not Activated and receives Damage, the controlling player may count this Unit as Activated in this Phase (flip its Activation Marker) to reduce the Total Damage by 2."
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "name": {
                      "stringValue": "Psi Blades"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 4 | HIT: 3+ | DMG: 1\nSURGE: Light (D3)"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "20"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "name": {
                      "stringValue": "We Stand as One"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit makes a Close Combat Attack, if the target is Engaged with at least 1 other Friendly Unit, this Unit's Close Combat Weapon gains PRECISION (2)."
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    }
                  }
                }
              }
            ]
          }
        },
        "tags": {
          "stringValue": "Biological, Light, Ground"
        },
        "combatRange": {
          "stringValue": "1"
        },
        "name": {
          "stringValue": "Zealot"
        },
        "unitType": {
          "stringValue": "Core"
        },
        "faction": {
          "stringValue": "Protoss"
        },
        "small": {
          "mapValue": {
            "fields": {
              "models": {
                "integerValue": "3"
              },
              "cost": {
                "integerValue": "160"
              },
              "supply": {
                "integerValue": "2"
              }
            }
          }
        },
        "id": {
          "stringValue": "zealot"
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "supply": {
                      "integerValue": "1"
                    },
                    "tier": {
                      "integerValue": "1"
                    },
                    "modelCount": {
                      "stringValue": "1 - 1"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "2 - 3"
                    },
                    "tier": {
                      "integerValue": "2"
                    },
                    "supply": {
                      "integerValue": "2"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "-"
                    },
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "3"
                    }
                  }
                }
              }
            ]
          }
        },
        "large": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "0"
              },
              "cost": {
                "integerValue": "0"
              },
              "models": {
                "integerValue": "0"
              }
            }
          }
        },
        "keywords": {
          "stringValue": ""
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-09T17:51:49.738778Z"
    },
    {
      "name": "projects/starcrafttmgbeta/databases/starcrafttmgbeta/documents/army_units/zergling",
      "fields": {
        "stats": {
          "mapValue": {
            "fields": {
              "speed": {
                "stringValue": "4/8"
              },
              "evade": {
                "stringValue": "4+"
              },
              "shield": {
                "stringValue": "-"
              },
              "size": {
                "stringValue": "1"
              },
              "hp": {
                "stringValue": "1"
              },
              "armor": {
                "stringValue": "6+"
              }
            }
          }
        },
        "tags": {
          "stringValue": "Biological, Light, Ground"
        },
        "upgrades": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "phase": {
                      "stringValue": "Any Phase"
                    },
                    "name": {
                      "stringValue": "Squadron"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit’s Horizontal Coherency is 4\"."
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "30"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "name": {
                      "stringValue": "Burrow Ambush"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "When this Unit is nominated to deploy from the Reserves, it may resolve the PLACE (18) effect from the controlling player's Entry Edge. No model may be set Within 10\" of any Enemy model. This Unit's Activation ends."
                    },
                    "phase": {
                      "stringValue": "Movement Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "activation": {
                      "stringValue": "\u003cActive\u003e\n(1 Biomass)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "description": {
                      "stringValue": "When determining Charge Distance for this Unit, roll 2D6 instead of D6 and use the higher result to add to the Unit’s Speed characteristic."
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "name": {
                      "stringValue": "Metabolic Boost"
                    },
                    "phase": {
                      "stringValue": "Assault Phase"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Assault Phase"
                    },
                    "name": {
                      "stringValue": "Devastating Charge"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "Immediately after this Unit completes a successful Charge, resolve the IMPACT (1) 5+ effect."
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "name": {
                      "stringValue": "Claws"
                    },
                    "linkedTo": {
                      "stringValue": "-"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 2 | HIT: 4+ | DMG: 1\nSURGE: Light (D3)"
                    },
                    "costS": {
                      "integerValue": "0"
                    },
                    "costL": {
                      "integerValue": "0"
                    },
                    "activation": {
                      "stringValue": ""
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "linkedTo": {
                      "stringValue": "Claws"
                    },
                    "description": {
                      "stringValue": "RANGE: E | TARGET: Ground | RoA: 2 | HIT: 4+ | DMG: 1\nSURGE: Light, Armoured (D3)"
                    },
                    "name": {
                      "stringValue": "Shredding Claws"
                    },
                    "activation": {
                      "stringValue": ""
                    },
                    "costS": {
                      "integerValue": "20"
                    },
                    "costL": {
                      "integerValue": "20"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "costS": {
                      "integerValue": "30"
                    },
                    "costL": {
                      "integerValue": "30"
                    },
                    "activation": {
                      "stringValue": "\u003cPassive\u003e"
                    },
                    "phase": {
                      "stringValue": "Combat Phase"
                    },
                    "name": {
                      "stringValue": "Adrenal Glands"
                    },
                    "linkedTo": {
                      "stringValue": ""
                    },
                    "description": {
                      "stringValue": "This Unit’s Claws and Shredding Claws weapons gain PRECISION (2)."
                    }
                  }
                }
              }
            ]
          }
        },
        "combatRange": {
          "stringValue": "1"
        },
        "name": {
          "stringValue": "Zergling"
        },
        "unitType": {
          "stringValue": "Core"
        },
        "faction": {
          "stringValue": "Zerg"
        },
        "small": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "1"
              },
              "models": {
                "integerValue": "12"
              },
              "cost": {
                "integerValue": "180"
              }
            }
          }
        },
        "id": {
          "stringValue": "zergling"
        },
        "squadProfile": {
          "arrayValue": {
            "values": [
              {
                "mapValue": {
                  "fields": {
                    "supply": {
                      "integerValue": "0"
                    },
                    "tier": {
                      "integerValue": "1"
                    },
                    "modelCount": {
                      "stringValue": "1 - 6"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "7 - 12"
                    },
                    "tier": {
                      "integerValue": "2"
                    },
                    "supply": {
                      "integerValue": "1"
                    }
                  }
                }
              },
              {
                "mapValue": {
                  "fields": {
                    "modelCount": {
                      "stringValue": "13 - 18"
                    },
                    "tier": {
                      "integerValue": "3"
                    },
                    "supply": {
                      "integerValue": "2"
                    }
                  }
                }
              }
            ]
          }
        },
        "large": {
          "mapValue": {
            "fields": {
              "supply": {
                "integerValue": "2"
              },
              "cost": {
                "integerValue": "220"
              },
              "models": {
                "integerValue": "18"
              }
            }
          }
        },
        "keywords": {
          "stringValue": ""
        }
      },
      "createTime": "2026-02-11T08:38:13.600411Z",
      "updateTime": "2026-03-16T21:23:54.477693Z"
    }
  ]
}

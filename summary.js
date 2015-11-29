// Generated by CoffeeScript 1.10.0
(function() {
  "use strict";
  var Bonus, Break, BreakFail, Capture, Expand, Knockout, KnockoutFail, Map, Summary, SummarySection, Terr,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Array.prototype.sum = function(fn) {
    if (fn == null) {
      fn = function(x) {
        return x;
      };
    }
    return this.reduce((function(a, b) {
      return a + fn(b);
    }), 0);
  };

  SummarySection = (function() {
    SummarySection.prototype.notes = [];

    SummarySection.prototype.moves = [];

    SummarySection.prototype.header = null;

    SummarySection.prototype.bonuses = [];

    function SummarySection() {
      this.getText = bind(this.getText, this);
      this.getBodyText = bind(this.getBodyText, this);
      this.getHeaderText = bind(this.getHeaderText, this);
      this.notes = [];
      this.moves = [];
      this.expands = [];
      this.header = null;
      this.events = [];
    }

    SummarySection.prototype.getHeaderText = function() {
      var r;
      r = (this.header.turn === 0 ? '[After Distribution]' : "[Turn " + this.header.turn + "]");
      if (this.notes.length) {
        r += ' ' + this.notes.join('');
      }
      return r;
    };

    SummarySection.prototype.getBodyText = function() {
      var e, ee, r, x;
      r = '';
      ee = ((function() {
        var l, len, ref, ref1, results;
        ref = this.events;
        results = [];
        for (l = 0, len = ref.length; l < len; l++) {
          e = ref[l];
          if (e instanceof Expand && (ref1 = e.bonus, indexOf.call((function() {
            var len1, m, ref2, results1;
            ref2 = this.events;
            results1 = [];
            for (m = 0, len1 = ref2.length; m < len1; m++) {
              x = ref2[m];
              if (x instanceof Capture && x.player === e.player) {
                results1.push(x.bonus);
              }
            }
            return results1;
          }).call(this), ref1) < 0)) {
            results.push(e);
          }
        }
        return results;
      }).call(this)).sort(function(a, b) {
        return a.player.id < b.player.id;
      });
      r += ((function() {
        var l, len, results;
        results = [];
        for (l = 0, len = ee.length; l < len; l++) {
          e = ee[l];
          results.push(e.getText());
        }
        return results;
      })()).join('');
      r += ((function() {
        var l, len, ref, results;
        ref = this.events;
        results = [];
        for (l = 0, len = ref.length; l < len; l++) {
          e = ref[l];
          if (e instanceof Capture) {
            results.push(e.getText());
          }
        }
        return results;
      }).call(this)).join('');
      r += ((function() {
        var l, len, ref, results;
        ref = this.events;
        results = [];
        for (l = 0, len = ref.length; l < len; l++) {
          e = ref[l];
          if (e instanceof KnockoutFail) {
            results.push(e.getText());
          }
        }
        return results;
      }).call(this)).join('');
      r += ((function() {
        var l, len, ref, results;
        ref = this.events;
        results = [];
        for (l = 0, len = ref.length; l < len; l++) {
          e = ref[l];
          if (e instanceof Knockout) {
            results.push(e.getText());
          }
        }
        return results;
      }).call(this)).join('');
      r += ((function() {
        var l, len, ref, results;
        ref = this.events;
        results = [];
        for (l = 0, len = ref.length; l < len; l++) {
          e = ref[l];
          if (e instanceof BreakFail) {
            results.push(e.getText());
          }
        }
        return results;
      }).call(this)).join('');
      r += ((function() {
        var l, len, ref, results;
        ref = this.events;
        results = [];
        for (l = 0, len = ref.length; l < len; l++) {
          e = ref[l];
          if (e instanceof Break) {
            results.push(e.getText());
          }
        }
        return results;
      }).call(this)).join('');
      return r;
    };

    SummarySection.prototype.getText = function() {
      return this.getHeaderText() + '\n' + this.getBodyText() + '\n';
    };

    return SummarySection;

  })();

  Summary = (function() {
    var sections;

    Summary.prototype.data = null;

    Summary.prototype.map = null;

    Summary.prototype.id = null;

    Summary.prototype.turnCount = null;

    Summary.prototype.players = {};

    Summary.prototype.allPlayers = [];

    sections = [];

    Summary.prototype.current = null;

    function Summary(g) {
      var b, changed, i, isKnockout, j, k, l, len, len1, len2, len3, len4, len5, len6, len7, len8, m, n, o, oldOwner, p, pick, pickIndex, pid, pk, player, q, rcount, ref, ref1, ref10, ref11, ref12, ref13, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, s, t, terr, tfrom, tto, turn, u, v, w, x, xp, y, zz;
      this.g = g;
      this.getText = bind(this.getText, this);
      this.data = JSON.parse(this.g);
      this.id = this.data.id;
      this.turnCount = this.data.numberOfTurns;
      this.players = {};
      this.allPlayers = [];
      this.sections = [];
      this.map = new Map(this.data.map);
      this.map.summary = this;
      ref = this.data.players;
      for (i = l = 0, len = ref.length; l < len; i = ++l) {
        p = ref[i];
        pid = p.id.slice(2, -2);
        xp = {
          id: pid,
          name: p.name,
          state: p.state,
          picks: [],
          received: [],
          starts: [],
          intel: [],
          bonusIncome: 0,
          totalArmies: null,
          mobileArmies: 0,
          ownedTerrs: null
        };
        this.players[pid] = xp;
        this.allPlayers.push(xp);
      }
      ref1 = this.players;
      for (k in ref1) {
        p = ref1[k];
        pk = "player_" + p.id;
        ref2 = this.data.picks[pk];
        for (j = m = 0, len1 = ref2.length; m < len1; j = ++m) {
          pick = ref2[j];
          p.picks.push(this.map.terrs[pick]);
        }
      }
      ref3 = this.data.standings[0];
      for (n = 0, len2 = ref3.length; n < len2; n++) {
        t = ref3[n];
        terr = this.map.terrs[t.terrID];
        terr.armies = parseInt(t.armies);
        if (t.ownedBy !== 'Neutral') {
          player = this.players[t.ownedBy];
          terr.owner = player;
          player.starts.push(terr);
          pickIndex = player.picks.indexOf(terr);
          player.received.push(pickIndex);
        }
      }
      ref4 = this.players;
      for (k in ref4) {
        p = ref4[k];
        p.received.sort();
        rcount = p.received.length;
        if (rcount > 0) {
          ref5 = p.picks;
          for (i = q = 0, len3 = ref5.length; q < len3; i = ++q) {
            pick = ref5[i];
            if ((indexOf.call(p.received, i) < 0) && (i < p.received[rcount - 1])) {
              p.intel.push(pick);
            }
          }
        }
      }
      this.sections = [];
      this.current = new SummarySection();
      this.current.header = {
        turn: 0
      };
      this.current.notes.push('\n');
      ref6 = this.players;
      for (k in ref6) {
        p = ref6[k];
        this.current.notes.push(p.name + " receives picks " + (((function() {
          var len4, ref7, results, s;
          ref7 = p.received;
          results = [];
          for (s = 0, len4 = ref7.length; s < len4; s++) {
            x = ref7[s];
            results.push(x + 1);
          }
          return results;
        })()).join(',')) + "\n");
        this.current.notes.push("    starts in " + (((function() {
          var len4, ref7, results, s;
          ref7 = p.starts;
          results = [];
          for (s = 0, len4 = ref7.length; s < len4; s++) {
            x = ref7[s];
            results.push(x.bonus.name + " (" + x.name + ")");
          }
          return results;
        })()).join(', ')) + "\n");
        if (p.intel.length > 0) {
          this.current.notes.push("    knows enemy is in " + (((function() {
            var len4, ref7, results, s;
            ref7 = p.intel;
            results = [];
            for (s = 0, len4 = ref7.length; s < len4; s++) {
              x = ref7[s];
              results.push(x.bonus.name + " (" + x.name + ")");
            }
            return results;
          })()).join(', ')) + "\n");
        } else {
          this.current.notes.push("    has no intel on the enemy\n");
        }
      }
      this.sections.push(this.current);
      ref7 = this.data.turns;
      for (i = s = 0, len4 = ref7.length; s < len4; i = ++s) {
        turn = ref7[i];
        ref8 = this.data.standings[i];
        for (u = 0, len5 = ref8.length; u < len5; u++) {
          t = ref8[u];
          terr = this.map.terrs[t.terrID];
          terr.armies = parseInt(t.armies);
          if (t.ownedBy !== 'Neutral') {
            player = this.players[t.ownedBy];
            terr.owner = player;
          } else {
            terr.owner = null;
          }
        }
        this.current = new SummarySection();
        this.sections.push(this.current);
        this.current.header = {
          turn: i + 1
        };
        ref9 = turn.orders;
        for (v = 0, len6 = ref9.length; v < len6; v++) {
          o = ref9[v];
          o.armies = parseInt(o.armies);
          o.defendingArmiesKilled = parseInt(o.defendingArmiesKilled);
          o.attackersKilled = parseInt(o.attackersKilled);
        }
        ref10 = this.allPlayers;
        for (w = 0, len7 = ref10.length; w < len7; w++) {
          p = ref10[w];
          p.bonusIncome = ((function() {
            var len8, ref11, results, y;
            ref11 = this.map.allBonuses;
            results = [];
            for (y = 0, len8 = ref11.length; y < len8; y++) {
              b = ref11[y];
              if (b.getOwner() === p) {
                results.push(b.value);
              }
            }
            return results;
          }).call(this)).sum();
          p.mobileArmies = ((function() {
            var len8, ref11, results, y;
            ref11 = this.map.allTerrs;
            results = [];
            for (y = 0, len8 = ref11.length; y < len8; y++) {
              x = ref11[y];
              if (x.owner === p) {
                results.push(x.armies > 0 ? x.armies - 1 : 0);
              }
            }
            return results;
          }).call(this)).sum();
          p.ownedTerrs = (function() {
            var len8, ref11, results, y;
            ref11 = this.map.allTerrs;
            results = [];
            for (y = 0, len8 = ref11.length; y < len8; y++) {
              x = ref11[y];
              if (x.owner === p) {
                results.push(x);
              }
            }
            return results;
          }).call(this);
          this.current.notes.push("  <<" + p.name + " [bonus: " + p.bonusIncome + ", mobile armies: " + p.mobileArmies + "]>>");
        }
        ref11 = turn.orders;
        for (y = 0, len8 = ref11.length; y < len8; y++) {
          o = ref11[y];
          if (o.type === 'WarLight.Shared.GameOrderDeploy') {
            this.map.terrs[o.deployOn].armies += o.armies;
          } else if (o.type === 'WarLight.Shared.GameOrderAttackTransfer') {
            tfrom = this.map.terrs[o.attackFrom];
            tto = this.map.terrs[o.attackTo];
            if (o.isAttack) {
              this.current.moves.push((tfrom.ownerName()) + " attacks " + tto.name + " from " + tfrom.name);
              oldOwner = tto.owner;
              isKnockout = tto.owner && !((function() {
                var len9, ref12, results, z;
                ref12 = tto.connects;
                results = [];
                for (z = 0, len9 = ref12.length; z < len9; z++) {
                  x = ref12[z];
                  if (x.owner === tto.owner) {
                    results.push(x);
                  }
                }
                return results;
              })()).length;
              if (o.isSuccessful === 'True') {
                if (isKnockout) {
                  this.current.events.push(new Knockout(tto, tfrom.owner, oldOwner));
                }
                changed = tto.setOwner(tfrom.owner, this.current);
                if (changed) {
                  if (changed.oldOwner) {
                    this.current.events.push(new Break(changed.bonus, tfrom, tfrom.owner, tto.owner));
                    if ((ref12 = changed.oldOwner) != null) {
                      ref12.bonusIncome -= changed.bonus.value;
                    }
                  }
                  if (changed.newOwner) {
                    this.current.events.push(new Capture(changed.bonus, tfrom.owner));
                    if ((ref13 = changed.newOwner) != null) {
                      ref13.bonusIncome += changed.bonus.value;
                    }
                  }
                } else {
                  zz = (function() {
                    var len9, ref14, results, z;
                    ref14 = this.current.events;
                    results = [];
                    for (z = 0, len9 = ref14.length; z < len9; z++) {
                      x = ref14[z];
                      if (x instanceof Expand && x.player === tto.owner && x.bonus === tto.bonus) {
                        results.push(x);
                      }
                    }
                    return results;
                  }).call(this);
                  console.log(zz);
                  if (!zz.length && oldOwner === null) {
                    this.current.events.push(new Expand(tto.bonus, tto.owner));
                  }
                }
                tto.armies = o.armies - o.attackersKilled;
                tfrom.armies -= o.armies;
              } else {
                if (isKnockout) {
                  this.current.events.push(new KnockoutFail(tto, tfrom.owner, oldOwner));
                }
                if (tto.bonus.getOwner() && tto.bonus.getOwner() === tto.owner) {
                  this.current.events.push(new BreakFail(tto.bonus, tfrom, tfrom.owner, tto.owner));
                }
                tto.armies -= o.defendingArmiesKilled;
                tfrom.armies -= o.attackersKilled;
              }
            } else {
              if (o.isSuccessful) {
                tto.armies += o.armies;
                tfrom.armies -= o.armies;
              }
            }
          }
        }
      }
      console.log("summary created: " + this.id);
    }

    Summary.prototype.getText = function() {
      var r, x;
      r = '';
      if (this.data.state === 'Finished') {
        r = (((function() {
          var l, len, ref, results;
          ref = this.allPlayers;
          results = [];
          for (l = 0, len = ref.length; l < len; l++) {
            x = ref[l];
            if (x.state === 'Won') {
              results.push(x.name);
            }
          }
          return results;
        }).call(this)).join(', ')) + " defeats " + (((function() {
          var l, len, ref, results;
          ref = this.allPlayers;
          results = [];
          for (l = 0, len = ref.length; l < len; l++) {
            x = ref[l];
            if (x.state !== 'Won') {
              results.push(x.name);
            }
          }
          return results;
        }).call(this)).join(', ')) + " in " + this.turnCount + " turns\n";
      } else {

      }
      r += "Game Link: https://www.warlight.net/MultiPlayer?GameID=" + this.id + "\n\n";
      r += ((function() {
        var l, len, ref, results;
        ref = this.sections;
        results = [];
        for (l = 0, len = ref.length; l < len; l++) {
          x = ref[l];
          results.push(x.getText());
        }
        return results;
      }).call(this)).join('\n');
      return r;
    };

    return Summary;

  })();


  /*
  first entry to n
   */

  exports.Summary = Summary;

  Capture = (function() {
    function Capture(bonus, player1) {
      this.bonus = bonus;
      this.player = player1;
      this.getText = bind(this.getText, this);
    }

    Capture.prototype.getText = function() {
      return this.player.name + " CAPTURES " + this.bonus.name + " (+" + this.bonus.value + ")\n";
    };

    return Capture;

  })();

  Break = (function() {
    function Break(bonus, from, player1, defender) {
      this.bonus = bonus;
      this.from = from;
      this.player = player1;
      this.defender = defender;
      this.getText = bind(this.getText, this);
    }

    Break.prototype.getText = function() {
      return this.player.name + " BREAKS " + this.bonus.name + " from " + this.from.name + " (-" + this.bonus.value + ")\n";
    };

    return Break;

  })();

  BreakFail = (function() {
    function BreakFail(bonus, from, player1, defender) {
      this.bonus = bonus;
      this.from = from;
      this.player = player1;
      this.defender = defender;
      this.getText = bind(this.getText, this);
    }

    BreakFail.prototype.getText = function() {
      return this.player.name + " attempts to break " + this.bonus.name + " from " + this.from.name + ", but fails\n";
    };

    return BreakFail;

  })();

  Expand = (function() {
    function Expand(bonus, player1) {
      this.bonus = bonus;
      this.player = player1;
      this.getText = bind(this.getText, this);
    }

    Expand.prototype.getText = function() {
      return this.player.name + " expands in " + this.bonus.name + "\n";
    };

    return Expand;

  })();

  Knockout = (function() {
    function Knockout(terr1, player1, defender) {
      this.terr = terr1;
      this.player = player1;
      this.defender = defender;
      this.getText = bind(this.getText, this);
    }

    Knockout.prototype.getText = function() {
      return this.player.name + " takes " + this.terr.name + ", KNOCKING " + this.defender.name + " out of the area\n";
    };

    return Knockout;

  })();

  KnockoutFail = (function() {
    function KnockoutFail(terr1, player1, defender) {
      this.terr = terr1;
      this.player = player1;
      this.defender = defender;
      this.getText = bind(this.getText, this);
    }

    KnockoutFail.prototype.getText = function() {
      return this.player.name + " attacks " + this.terr.name + ", attempting to knock " + this.defender.name + " out of the area, but fails\n";
    };

    return KnockoutFail;

  })();

  Terr = (function() {
    function Terr() {
      this.setOwner = bind(this.setOwner, this);
      this.ownerName = bind(this.ownerName, this);
    }

    Terr.prototype.id = null;

    Terr.prototype.name = null;

    Terr.prototype.bonus = null;

    Terr.prototype.owner = null;

    Terr.prototype.armies = null;

    Terr.prototype.connects = null;

    Terr.prototype.ownerName = function() {
      if (this.owner) {
        return this.owner.name;
      } else {
        return '(neutral)';
      }
    };

    Terr.prototype.setOwner = function(o, section) {
      var newOwner, oldOwner, r;
      r = null;
      if (o === this.owner) {
        return null;
      }
      if (this.bonus) {
        oldOwner = this.bonus.getOwner();
        this.owner = o;
        newOwner = this.bonus.getOwner();
        if (newOwner !== oldOwner) {
          r = {
            bonus: this.bonus,
            oldOwner: oldOwner,
            newOwner: newOwner
          };
        }
      } else {
        this.owner = o;
      }
      return r;
    };

    return Terr;

  })();

  Bonus = (function() {
    function Bonus() {
      this.addTerr = bind(this.addTerr, this);
      this.getOwner = bind(this.getOwner, this);
    }

    Bonus.prototype.id = null;

    Bonus.prototype.name = null;

    Bonus.prototype.value = null;

    Bonus.prototype.terrs = [];

    Bonus.prototype.getOwner = function() {
      var l, len, ref, t, xo;
      xo = this.terrs[0].owner;
      ref = this.terrs;
      for (l = 0, len = ref.length; l < len; l++) {
        t = ref[l];
        if (t.owner !== xo) {
          return null;
        }
      }
      return xo;
    };

    Bonus.prototype.addTerr = function(t) {
      return this.terrs.push(t);
    };

    return Bonus;

  })();

  Map = (function() {
    Map.prototype.summary = null;

    Map.prototype.name = null;

    Map.prototype.allTerrs = [];

    Map.prototype.allBonuses = [];

    Map.prototype.terrs = {};

    Map.prototype.bonuses = {};

    function Map(m) {
      var b, i, id, l, len, len1, len2, len3, len4, len5, len6, n, q, ref, ref1, ref2, ref3, ref4, ref5, ref6, s, t, u, v, w, xb, xt;
      this.m = m;
      ref = this.m.bonuses;
      for (i = l = 0, len = ref.length; l < len; i = ++l) {
        b = ref[i];
        xb = new Bonus();
        xb.id = b.id;
        xb.name = b.name;
        xb.value = parseInt(b.value);
        xb.terrs = [];
        this.allBonuses.push(xb);
        this.bonuses[b.id] = xb;
      }
      ref1 = this.m.territories;
      for (i = n = 0, len1 = ref1.length; n < len1; i = ++n) {
        t = ref1[i];
        xt = new Terr();
        xt.id = t.id;
        xt.name = t.name;
        xt.connects = [];
        this.allTerrs.push(xt);
        this.terrs[t.id] = xt;
      }
      ref2 = this.m.bonuses;
      for (i = q = 0, len2 = ref2.length; q < len2; i = ++q) {
        b = ref2[i];
        ref3 = b.territoryIDs;
        for (s = 0, len3 = ref3.length; s < len3; s++) {
          id = ref3[s];
          this.terrs[id].bonus = this.bonuses[b.id];
          this.bonuses[b.id].addTerr(this.terrs[id]);
        }
      }
      ref4 = this.m.territories;
      for (i = u = 0, len4 = ref4.length; u < len4; i = ++u) {
        t = ref4[i];
        ref5 = t.connectedTo;
        for (v = 0, len5 = ref5.length; v < len5; v++) {
          id = ref5[v];
          this.terrs[t.id].connects.push(this.terrs[id]);
        }
      }
      ref6 = this.terrs;
      for (i = w = 0, len6 = ref6.length; w < len6; i = ++w) {
        t = ref6[i];
        console.log(i + " " + t.name + " " + t.bonus.name);
      }
    }

    return Map;

  })();

}).call(this);

//# sourceMappingURL=summary.js.map

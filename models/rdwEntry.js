const mongoose = require("mongoose");

const RdwEntrySchema = new mongoose.Schema(
  {
    kenteken: { type: String, required: true },
    voertuigsoort: String,
    merk: String,
    handelsbenaming: String,
    vervaldatum_apk: String,
    datum_tenaamstelling: String,
    bruto_bpm: String,
    inrichting: String,
    aantal_zitplaatsen: String,
    eerste_kleur: String,
    tweede_kleur: String,
    aantal_cilinders: String,
    cilinderinhoud: String,
    massa_ledig_voertuig: String,
    toegestane_maximum_massa_voertuig: String,
    massa_rijklaar: String,
    datum_eerste_toelating: String,
    datum_eerste_tenaamstelling_in_nederland: String,
    wacht_op_keuren: String,
    catalogusprijs: String,
    wam_verzekerd: String,
    aantal_deuren: String,
    aantal_wielen: String,
    lengte: String,
    maximale_constructiesnelheid: String,
    europese_voertuigcategorie: String,
    plaats_chassisnummer: String,
    technische_max_massa_voertuig: String,
    type: String,
    typegoedkeuringsnummer: String,
    variant: String,
    uitvoering: String,
    volgnummer_wijziging_eu_typegoedkeuring: String,
    vermogen_massarijklaar: String,
    nettomaximumvermogen: String,
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

RdwEntrySchema.index({ kenteken: 1 }, { unique: true });
RdwEntrySchema.index({ lastUpdated: -1 });

module.exports = mongoose.model("RdwEntry", RdwEntrySchema);

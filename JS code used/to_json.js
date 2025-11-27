// Helper to safely convert a field/component to string
function val(x) {
    return (x && x.toString()) || "";
}

// Convert HL7 TS (YYYYMMDD[HHMM[SS]]) to ISO-ish string YYYY-MM-DDTHH:MM
function hl7DateTimeToIso(ts) {
    ts = val(ts);
    if (ts === "") return "";

    var year  = ts.substring(0, 4);
    var month = ts.substring(4, 6);
    var day   = ts.substring(6, 8) || "01";
    var hour  = ts.length >= 10 ? ts.substring(8, 10) : "00";
    var min   = ts.length >= 12 ? ts.substring(10, 12) : "00";

    return year + "-" + month + "-" + day + "T" + hour + ":" + min;
}

// ------------------------------
// Extract HL7 fields
// ------------------------------

// MSH
var msgType = val(msg['MSH']['MSH.9']['MSH.9.1']); // REF
var event   = val(msg['MSH']['MSH.9']['MSH.9.2']); // I12

// RF1 (Referral info)
var rfStatus = val(msg['RF1']['RF1.1']['RF1.1.1']); // A
var rfPrio   = val(msg['RF1']['RF1.2']['RF1.2.1']); // R
var rfServ   = val(msg['RF1']['RF1.3']['RF1.3.1']); // CARD
var rfDateTs = val(msg['RF1']['RF1.9']['RF1.9.1']); // 202511241015

// PID (Patient)
var mrn           = val(msg['PID']['PID.3']['PID.3.1']); // 12345
var assigningAuth = val(msg['PID']['PID.3']['PID.3.4']); // CLINIC_A
var idType        = val(msg['PID']['PID.3']['PID.3.5']); // MR
var lastName      = val(msg['PID']['PID.5']['PID.5.1']); // CLARK
var firstName     = val(msg['PID']['PID.5']['PID.5.2']); // ANNA
var dobTs         = val(msg['PID']['PID.7']['PID.7.1']); // 19900115
var sex           = val(msg['PID']['PID.8']['PID.8.1']); // F

// PV1 (Visit)
var patientClass = val(msg['PV1']['PV1.2']['PV1.2.1']);   // O
var loc          = val(msg['PV1']['PV1.3']['PV1.3.1']);   // CLINIC
var room         = val(msg['PV1']['PV1.3']['PV1.3.2']);   // ROOM1

// Provider from PV1-7 (Attending)
var provId    = val(msg['PV1']['PV1.7']['PV1.7.1']);      // 1234
var provLast  = val(msg['PV1']['PV1.7']['PV1.7.2']);      // DOE
var provFirst = val(msg['PV1']['PV1.7']['PV1.7.3']);      // JOHN

// SCH (Appointment)
var apptId      = val(msg['SCH']['SCH.2']['SCH.2.1']);        // APT123
var apptDur     = val(msg['SCH']['SCH.6']['SCH.6.1']);        // 30
var apptDurUnit = val(msg['SCH']['SCH.7']['SCH.7.1']);        // MIN
var apptStartTs = val(msg['SCH']['SCH.11']['SCH.11.1']);      // 202511251000
var apptEndTs   = val(msg['SCH']['SCH.12']['SCH.12.1']);      // 202511251030
var apptStatus  = val(msg['SCH']['SCH.16']['SCH.16.1']);      // BOOKED

// AIG (Resource / Clinic)
var clinicCode  = val(msg['AIG']['AIG.3']['AIG.3.1']);        // CARD_CLINIC

// ------------------------------
// Build JavaScript object for JSON
// ------------------------------
var referralJsonObj = {
    message_type: msgType + "^" + event,
    referral: {
        status: rfStatus,
        priority: rfPrio,
        service: rfServ,
        referral_datetime: hl7DateTimeToIso(rfDateTs)
    },
    patient: {
        mrn: mrn,
        assigning_authority: assigningAuth,
        identifier_type: idType,
        last_name: lastName,
        first_name: firstName,
        dob: hl7DateTimeToIso(dobTs),
        sex: sex
    },
    visit: {
        patient_class: patientClass,
        location: loc,
        room: room
    },
    provider: {
        id: provId,
        last_name: provLast,
        first_name: provFirst
    },
    appointment: {
        id: apptId,
        start: hl7DateTimeToIso(apptStartTs),
        end: hl7DateTimeToIso(apptEndTs),
        duration: apptDur !== "" ? Number(apptDur) : null,
        duration_unit: apptDurUnit,
        status: apptStatus,
        clinic: clinicCode
    }
};

// Serialize object to JSON string
var outJson = JSON.stringify(referralJsonObj, null, "\t");

// Put JSON string into channel map for the destination File Writer
channelMap.put('referralJson', outJson);

// Optional: log for debugging in Mirth
logger.info("REF_I12 JSON Output:\n" + outJson);
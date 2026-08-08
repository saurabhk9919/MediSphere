const vitalService = require("./vital.service");

class VirtualDeviceService {
  constructor() {
    this.isRunning = false;
    this.patientId = null;
    this.doctorId = null;
    this.currentVitals = null;
    this.intervalId = null;
  }

  start(doctorId, patientId) {
    // If a simulation is already running, clean up the previous one
    if (this.isRunning) {
      this.stop();
    }

    this.isRunning = true;
    this.patientId = patientId;
    this.doctorId = doctorId;

    // Initialize baseline starting vitals
    this.currentVitals = {
      heartRate: 78,
      spo2: 98,
      temperature: 36.7
    };

    // Start simulation interval (runs every 5 seconds)
    // Saves to the database using the existing vitalService
    this.intervalId = setInterval(async () => {
      if (!this.isRunning) return;

      // Heart Rate: 70-90 BPM (gradual changes)
      const hrDiff = Math.floor(Math.random() * 5) - 2; // -2, -1, 0, 1, 2
      let nextHr = this.currentVitals.heartRate + hrDiff;
      if (nextHr < 70) nextHr = 70;
      if (nextHr > 90) nextHr = 90;

      // SpO2: 96-100% (stable)
      let spo2Diff = 0;
      const rand = Math.random();
      if (rand < 0.15) spo2Diff = -1;
      else if (rand > 0.85) spo2Diff = 1;
      let nextSpo2 = this.currentVitals.spo2 + spo2Diff;
      if (nextSpo2 < 96) nextSpo2 = 96;
      if (nextSpo2 > 100) nextSpo2 = 100;

      // Temperature: 36.4 - 37.2°C (gradual changes)
      const tempDiff = (Math.floor(Math.random() * 3) - 1) * 0.1; // -0.1, 0, 0.1
      let nextTemp = Math.round((this.currentVitals.temperature + tempDiff) * 10) / 10;
      if (nextTemp < 36.4) nextTemp = 36.4;
      if (nextTemp > 37.2) nextTemp = 37.2;

      this.currentVitals = {
        heartRate: nextHr,
        spo2: nextSpo2,
        temperature: nextTemp
      };

      try {
        await vitalService.recordVitals(this.doctorId, {
          patientId: this.patientId,
          heartRate: nextHr,
          spo2: nextSpo2,
          temperature: nextTemp
        });
        console.log(`[VirtualDevice] Recorded Vitals to DB for Patient ${this.patientId} (Dr. ${this.doctorId}): HR=${nextHr}, SpO2=${nextSpo2}, Temp=${nextTemp}`);
      } catch (err) {
        console.error(`[VirtualDevice] Error recording simulated vitals to DB: ${err.message}`);
      }
    }, 5000);

    return this.status();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = null;
    this.isRunning = false;
    this.patientId = null;
    this.doctorId = null;
    this.currentVitals = null;

    return this.status();
  }

  status() {
    return {
      isRunning: this.isRunning,
      patientId: this.patientId,
      doctorId: this.doctorId,
      currentVitals: this.currentVitals
    };
  }
}

module.exports = new VirtualDeviceService();

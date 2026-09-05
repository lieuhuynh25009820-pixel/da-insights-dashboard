window.computeDashboard = function computeDashboard(filter) {
  const B = window.BOOKINGS;
  const nAll = B.n;
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const MSHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const SEGS = ["Online TA", "Offline TA/TO", "Direct", "Groups", "Corporate", "Complementary", "Aviation", "Unknown"];
  const PARTY = ["Couple", "Solo", "Family", "Group / Other"];
  const AGENTS = ["Other agents", "Agent 9 (Online TA)", "Direct (no agent)"];
  const DEPS = ["No Deposit", "Non Refund", "Refundable"];
  const LEAD = ["0–7 days", "8–30 days", "31–60 days", "61–90 days", "91–180 days", "181–360 days", "360+ days"];
  const LEAD_OTA = ["0–30 days", "31–60 days", "61–90 days", "91–120 days", "121–180 days", "180+ days"];

  function leadBin(lt) {
    if (lt <= 7) return 0;
    if (lt <= 30) return 1;
    if (lt <= 60) return 2;
    if (lt <= 90) return 3;
    if (lt <= 180) return 4;
    if (lt <= 360) return 5;
    return 6;
  }
  function leadOtaBin(lt) {
    if (lt <= 30) return 0;
    if (lt <= 60) return 1;
    if (lt <= 90) return 2;
    if (lt <= 120) return 3;
    if (lt <= 180) return 4;
    return 5;
  }
  function bucket() {
    return { n: 0, c: 0, adr: 0, nights: 0, rev: 0, crev: 0 };
  }
  function add(st, canceled, rate, nights) {
    st.n += 1;
    st.c += canceled;
    st.adr += rate;
    st.nights += nights;
    const r = rate * nights;
    st.rev += r;
    if (canceled) st.crev += r;
  }
  function pack(map, names) {
    return names.map((name, i) => {
      const s = map[i] || map[name];
      if (!s || !s.n) return null;
      return {
        name,
        bookings: s.n,
        canceled: s.c,
        cancel: s.c / s.n,
        adr: s.adr / s.n,
        nights: s.nights / s.n,
        revenue: s.rev,
        revenueAtRisk: s.crev,
        realizedRevenue: s.rev - s.crev
      };
    }).filter(Boolean);
  }

  const f = filter || {};
  const tot = bucket();
  const byYear = { 0: bucket(), 1: bucket(), 2: bucket() };
  const byMonth = Array.from({ length: 12 }, bucket);
  const byHotel = [bucket(), bucket()];
  const bySeg = Array.from({ length: 8 }, bucket);
  const byParty = Array.from({ length: 4 }, bucket);
  const byPark = [bucket(), bucket()];
  const byReq = Array.from({ length: 6 }, bucket);
  const byChg = [bucket(), bucket()];
  const byRoom = [bucket(), bucket()];
  const byLoyal = [bucket(), bucket()];
  const byDep = [bucket(), bucket(), bucket()];
  const byLead = Array.from({ length: 7 }, bucket);
  const byAgent = [bucket(), bucket(), bucket()];
  const leadOta = Array.from({ length: 6 }, bucket);
  const leadOff = Array.from({ length: 6 }, bucket);

  let keptN = 0;
  for (let i = 0; i < nAll; i++) {
    if (f.hotel !== "" && f.hotel != null && B.h[i] !== Number(f.hotel)) continue;
    if (f.year !== "" && f.year != null && B.y[i] !== Number(f.year)) continue;
    if (f.month !== "" && f.month != null && B.mo[i] !== Number(f.month)) continue;
    if (f.seg !== "" && f.seg != null && B.sg[i] !== Number(f.seg)) continue;
    if (f.party !== "" && f.party != null && B.pt[i] !== Number(f.party)) continue;
    if (f.loyal !== "" && f.loyal != null && B.rp[i] !== Number(f.loyal)) continue;
    if (f.park !== "" && f.park != null && B.pk[i] !== Number(f.park)) continue;
    if (f.deposit !== "" && f.deposit != null && B.dp[i] !== Number(f.deposit)) continue;
    if (f.change !== "" && f.change != null && B.ch[i] !== Number(f.change)) continue;
    const lead = B.lt[i];
    if (lead < f.leadMin || lead > f.leadMax) continue;

    keptN += 1;
    const canceled = B.c[i];
    const rate = B.adr[i] / 100;
    const nights = B.ni[i] / 10;
    add(tot, canceled, rate, nights);
    add(byYear[B.y[i]], canceled, rate, nights);
    add(byMonth[B.mo[i]], canceled, rate, nights);
    add(byHotel[B.h[i]], canceled, rate, nights);
    add(bySeg[B.sg[i]], canceled, rate, nights);
    add(byParty[B.pt[i]], canceled, rate, nights);
    add(byPark[B.pk[i]], canceled, rate, nights);
    add(byReq[B.rq[i]], canceled, rate, nights);
    add(byChg[B.ch[i]], canceled, rate, nights);
    add(byRoom[B.rd[i]], canceled, rate, nights);
    add(byLoyal[B.rp[i]], canceled, rate, nights);
    add(byDep[B.dp[i]], canceled, rate, nights);
    add(byLead[leadBin(lead)], canceled, rate, nights);
    add(byAgent[B.ag[i]], canceled, rate, nights);
    if (B.sg[i] === 0) add(leadOta[leadOtaBin(lead)], canceled, rate, nights);
    if (B.sg[i] === 1) add(leadOff[leadOtaBin(lead)], canceled, rate, nights);
  }

  const n = tot.n || 1;
  const hotels = pack(byHotel, ["City Hotel", "Resort Hotel"]);
  const segs = pack(bySeg, SEGS);
  const ota = segs.find((x) => x.name === "Online TA") || { bookings: 0, cancel: 0, adr: 0 };
  const direct = segs.find((x) => x.name === "Direct") || { bookings: 0, cancel: 0, adr: 0 };
  const city = hotels.find((x) => x.name === "City Hotel");
  const resort = hotels.find((x) => x.name === "Resort Hotel");
  const loyal = pack(byLoyal, ["First-time guest", "Repeat guest"]);
  const park = pack(byPark, ["No parking requested", "Parking requested (1+)"]);
  const repeat = loyal.find((x) => x.name === "Repeat guest");

  return {
    meta: window.DASHBOARD_DATA && window.DASHBOARD_DATA.meta,
    kpis: {
      bookings: tot.n,
      canceled: tot.c,
      realized: tot.n - tot.c,
      cancelRate: tot.n ? tot.c / tot.n : 0,
      adr: tot.n ? tot.adr / tot.n : 0,
      avgNights: tot.n ? tot.nights / tot.n : 0,
      grossRevenue: tot.rev,
      revenueAtRisk: tot.crev,
      realizedRevenue: tot.rev - tot.crev,
      city: city ? city.bookings : 0,
      resort: resort ? resort.bookings : 0,
      cityShare: tot.n && city ? city.bookings / tot.n : 0,
      otaShare: tot.n ? ota.bookings / tot.n : 0,
      otaCancel: ota.cancel || 0,
      directCancel: direct.cancel || 0,
      directAdr: direct.adr || 0,
      otaAdr: ota.adr || 0,
      repeatRate: repeat && tot.n ? repeat.bookings / tot.n : 0,
      parkingRequestRate: park[1] && tot.n ? park[1].bookings / tot.n : 0,
      filterCount: tot.n,
      filterShare: nAll ? tot.n / nAll : 0
    },
    years: [2023, 2024, 2025].map((year, i) => {
      const s = byYear[i];
      if (!s.n) return null;
      return {
        name: year,
        year,
        bookings: s.n,
        canceled: s.c,
        cancel: s.c / s.n,
        adr: s.adr / s.n,
        nights: s.nights / s.n,
        revenue: s.rev,
        revenueAtRisk: s.crev,
        realizedRevenue: s.rev - s.crev
      };
    }).filter(Boolean),
    months: byMonth.map((s, i) => {
      if (!s.n) return null;
      return {
        m: MSHORT[i],
        month: MONTHS[i],
        bookings: s.n,
        canceled: s.c,
        cancel: s.c / s.n,
        adr: s.adr / s.n,
        nights: s.nights / s.n,
        revenue: s.rev,
        revenueAtRisk: s.crev
      };
    }).filter(Boolean),
    hotels,
    party: pack(byParty, PARTY).sort((a, b) => b.bookings - a.bookings),
    segments: segs.sort((a, b) => b.bookings - a.bookings),
    agents: pack(byAgent, AGENTS).sort((a, b) => b.bookings - a.bookings),
    parking: pack(byPark, ["No parking requested", "Parking requested (1+)"]),
    requests: byReq.map((s, i) => ({
      n: i,
      bookings: s.n,
      canceled: s.c,
      cancel: s.n ? s.c / s.n : 0,
      share: tot.n ? s.n / tot.n : 0
    })).filter((x) => x.bookings),
    modifications: pack(byChg, ["No changes", "Modified (1+ changes)"]),
    rooms: pack(byRoom, ["Assigned = reserved", "Assigned ≠ reserved"]),
    loyalty: pack(byLoyal, ["First-time guest", "Repeat guest"]),
    deposits: pack(byDep, DEPS),
    lead: pack(byLead, LEAD),
    leadOta: LEAD_OTA.map((bin, i) => ({
      bin,
      ota: leadOta[i].n ? leadOta[i].c / leadOta[i].n : 0,
      otaN: leadOta[i].n,
      offline: leadOff[i].n ? leadOff[i].c / leadOff[i].n : 0,
      offN: leadOff[i].n
    })),
    keptN
  };
};

export enum VaccineName{
  Covaxin="COVAXIN",
  Covishild="COVISHIELD",
  Sputnik="SPUTNIK",

}

export interface ISessionSlot{
  center_id: number,
  name: string,
  name_l: string,
  address: string,
  address_l: string,
  state_name:string,
  state_name_l: string,
  district_name: string,
  district_name_l: string,
  block_name: string,
  block_name_l: string,
  pincode: string,
  lat: number,
  long: number,
  from: string|Date,
  to: string|Date,
  fee_type: "Paid"|"Free",
  fee: string,
  session_id: string,
  date: string|Date,
  available_capacity: number,
  available_capacity_dose1: number,
  available_capacity_dose2: number,
  min_age_limit: number,
  vaccine: VaccineName,
  slots: ("FORENOON"|"AFTERNOON")[]
      
}
export interface ICenterSlot{
  center_id: number,
  name: string,
  address: string,
  state_name:string,
  district_name: string,
  block_name: string,
  pincode: number,
  lat: number,
  long: number,
  from: string|Date,
  to: string|Date,
  fee_type: "Paid"|"Free",
  fee: string,
  sessions:ISessionSlot[],
  vaccine_fees:{ vaccine: VaccineName, fee: string }[]
}

export interface IConfig {
  start: Date;
  end: Date;
  pin: number;
  age: {
    '18': boolean;
    '45': boolean;
  };
  vaccine: {
    covishild: boolean;
    covaxin: boolean;
    sputnik: boolean;
  };
  price: {
    free: boolean;
    paid: boolean;
  };
}

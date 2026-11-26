export class InvalidNumericError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidNumericError";
  }
}

export class InvalidTemperatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTemperatureError";
  }
}

export class InvalidTemperatureRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTemperatureRangeError";
  }
}

export class InvalidPrecipitationProbabilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPrecipitationProbabilityError";
  }
}

export class InvalidHumidityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidHumidityError";
  }
}

export class InvalidWindError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidWindError";
  }
}

export class InvalidUVError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUVError";
  }
}

export class InvalidPrecipitationSumError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPrecipitationSumError";
  }
}

export class UnsupportedTimezoneTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedTimezoneTransitionError";
  }
}

export class NoDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoDataError";
  }
}

export class InvalidRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidRequestError";
  }
}

export class InvalidTimestampError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTimestampError";
  }
}

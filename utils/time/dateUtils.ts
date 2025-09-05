/**
 * Time utility functions for manipulating JavaScript Dates
 */

/** Seconds */
export function minusSeconds(date: Date, seconds: number): Date {
	return new Date(date.getTime() - seconds * 1000);
  }
  
  export function plusSeconds(date: Date, seconds: number): Date {
	return new Date(date.getTime() + seconds * 1000);
  }
  
  /** Minutes */
  export function minusMinutes(date: Date, minutes: number): Date {
	return new Date(date.getTime() - minutes * 60 * 1000);
  }
  
  export function plusMinutes(date: Date, minutes: number): Date {
	return new Date(date.getTime() + minutes * 60 * 1000);
  }
  
  /** Hours */
  export function minusHours(date: Date, hours: number): Date {
	return new Date(date.getTime() - hours * 60 * 60 * 1000);
  }
  
  export function plusHours(date: Date, hours: number): Date {
	return new Date(date.getTime() + hours * 60 * 60 * 1000);
  }
  
  /** Days */
  export function minusDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() - days);
	return result;
  }
  
  export function plusDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
  }
  
export const config = {
	getUrl: (pincode: number, date: Date) => {
		let day = (date.getDate() + 100).toString().substring(1);
		let month = (date.getMonth()+1 + 100).toString().substring(1);
		let year = (date.getFullYear() + 1000).toString().substring(2);
		return `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${pincode}&date=${day}-${month}-${year}`;
	},
	header: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.76 Safari/537.36" },
};

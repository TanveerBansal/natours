module.exports = fn => {
   return (req, res, next) => {
      // fn(req, res, next).catch((err) => {
         // console.log(err + "-thsi log from catchaync l4");

         // next(err)
      // });
       fn(req, res, next).catch(next);
   };
};
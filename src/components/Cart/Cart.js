import React, { Component } from 'react'
import { connect } from 'react-redux'
import axios from 'axios'
import { withRouter, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import StripeCheckout from 'react-stripe-checkout'
import './Cart.css'

class Cart extends Component {
  constructor (props) {
    super(props)

    this.state = {
      cart: [],
      total: null,
      reducedCart: [],
    }
  }

  componentDidMount () {
    this.getCart()
  }

// MANIPULATING CART ITEMS:
  getCart = async () => {
    axios
      .get(`/api/cart/${this.props.cus_id}`)
      .then( res => {
        this.setState({
          cart: res.data
        })
        let total = 0
        this.state.cart.filter(e => {
          return total += e.price
        })
        this.setState({
          total
        })
        this.reduceCart()
      })
      .catch(err => {
        console.log(err)
      })
  }

  reduceCart = () => {
    let { cart } = this.state
    let reducedCart = []

    cart.map( e => {
      const cartItem = reducedCart.find( item => (
        item.prod_id === e.prod_id
      ))
      if (!e.qty) {
        e.qty = 1
      }
      if (cartItem) {
        cartItem.qty += 1
        cartItem.price += e.price
      } else {
        reducedCart.push(e)
      }
    })
    this.setState({
      reducedCart
    })
  }

  removeItem = (id) => {
    axios
      .delete(`/api/cart/item/${id}`)
      .then( res => {
        if (res.status === 200) {
          toast.info('Item removed from cart.', {
            position: toast.POSITION.BOTTOM_RIGHT
          })
          this.getCart()
        }
      })
      .catch(err => {
        toast.error(`Unable to remove item. Please try again.`, {
          position: toast.POSITION.BOTTOM_RIGHT
        })
      })
  }

  clearCart = (id) => {
    axios
      .delete(`/api/cart/${id}`)
      .then( res => {
        if (res.status === 200) {
          toast.info('Your cart has been cleared.', {
            position: toast.POSITION.BOTTOM_RIGHT
          })
          this.props.history.push(`/shop`)
        }
      })
      .catch(err => {
        console.log(err)
        toast.error(`Unable to clear cart. Please try again.`, {
          position: toast.POSITION.BOTTOM_RIGHT
        })
      })
  }

  // NodeMailer:
  sendConfirmation = (id) => {
    console.log(id)
    const { email, username } = this.props
    axios
      .post(`/api/mail/${id}`, {email, username})
      .then( () => {
        toast.info(`An email confirmation has been sent to ${email}`, {
          position: toast.POSITION.BOTTOM_RIGHT
        })
      })
      .catch(err => {
        console.log(err)
      })
  }

  // PLACING AN ORDER:
  onOpened=()=>{
    console.log('this is opened')
  }

  onClosed=()=>{
    console.log('this is closed')
  }

  placeOrder = (token) => {
    let { total, cart } = this.state
    total *= 100
    token.card = void 0
    axios
      .post(`/api/payment/${this.props.cus_id}`, { token, total, cart })
      .then( res => {
        toast.info(`Thank you for purchasing our art!`, {
          position: toast.POSITION.BOTTOM_RIGHT
        })
        this.sendConfirmation(res.data.order_id)
        this.clearCart(this.props.cus_id)
      })
      .catch(err => {
        console.log(err)
        toast.error(`Something went wrong with your order. Please try again.`, {
          position: toast.POSITION.BOTTOM_RIGHT
        })
      })
  }

  render() {
    let cartItems = this.state.reducedCart.map((e, i) => {
      return (
        <div
          className='cart-item-card'
          key={i}
          {...e}
        >
          <Link 
            to={`/product/${e.prod_id}`} 
          >
            <img 
              alt='product'
              className='item-img'
              src={e.img}
            />
          </Link>
          <div
            className='item-info'
          >
            <p
              className='quantity info'
            >
              QUANTITY: {e.qty}
            </p>
            <p
              className='cart-price info'
            >
              ${e.price}
            </p>
            <button
              className='remove-item info'
              onClick={() => this.removeItem(e.cart_id)}
            >
              REMOVE ITEM
            </button>
          </div>
        </div>
      )
    })
    
    return (
      <div className='cart-page'>
        <div
          className='cart-items'
        >
          {cartItems}
        </div>
        <div
          className='order-card'
        >
          <button
            className='clear-cart'
            onClick={() => this.clearCart(this.props.cus_id)}
          >
            CLEAR CART
          </button>
          <p
            className='total'
          >
            TOTAL: ${this.state.total}
          </p>
          <div 
            style={{display:'flex',flexDirection:'column', alignItems:'center'}}
          >
            <StripeCheckout
              name='Artsy Fartsy Checkout' //header
              image='/assets/LOGO.jpg' // image at top
              description='Enter your payment information here.' //subtitle - beneath header
              stripeKey={process.env.REACT_APP_STRIPE_KEY} //public key not secret key
              token={this.placeOrder} //fires the call back
              amount={this.state.total * 100} //this will be in cents
              currency="USD"
              // image={imageUrl} // the pop-in header image (default none)
              // ComponentClass="div" //initial default button styling on block scope (defaults to span)
              panelLabel="Submit Payment" //text on the submit button
              locale="en" //locale or language (e.g. en=english, fr=french, zh=chinese)
              opened={this.onOpened} //fires cb when stripe is opened
              closed={this.onClosed} //fires cb when stripe is closed
              email={this.props.email}
              allowRememberMe={false} // "Remember Me" option (default true)
              billingAddress={false}
              shippingAddress={true} //you can collect their address
              zipCode={false}
            >
              <button
                className='checkout'
              >
                CHECKOUT
              </button>
            </StripeCheckout>
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = reduxState => {
  return {
    cus_id: reduxState.customer.cus_id,
    username: reduxState.customer.username,
    email: reduxState.customer.email
  }
}


export default connect(mapStateToProps)(withRouter(Cart))